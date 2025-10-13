import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { URL } from 'url';
import * as cheerio from 'cheerio';
import { ScrapingHttpClient } from '../utils/http-client.util';
import { translateCategory, translateCondition, createSlug, createEnglishSlug, createAutoRivenUrl } from '../common/translations.util';
import { Category as CategoryEntity } from '../products/entities/category.entity';
import { Subcategory as SubcategoryEntity } from '../products/entities/subcategory.entity';
import { Product as ProductEntity } from '../products/entities/product.entity';
import {
  ScrapingConfig,
  ScrapedProduct,
  ProductScrapingResult,
  ProductScrapingOptions,
} from './interfaces/scraping.interface';

@Injectable()
export class ProductScrapingService {
  private readonly logger = new Logger(ProductScrapingService.name);
  private readonly config: ScrapingConfig;
  private readonly httpClient: ScrapingHttpClient;
  private autoRivenProductIdCounter = 10000; // Starting AutoRiven Product ID (different range from categories)

  constructor(
    private configService: ConfigService,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(SubcategoryEntity)
    private subcategoryRepository: Repository<SubcategoryEntity>,
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>,
  ) {
    const proxyTokensEnv = this.configService.get<string>('SCRAPE_DO_TOKENS');
    const primaryProxyToken = this.configService.get<string>('SCRAPE_DO_TOKEN');
    const proxyTokens = proxyTokensEnv
      ?.split(',')
      .map(token => token.trim())
      .filter(token => token.length > 0);

    const requestDelay = Number(this.configService.get<string>('SCRAPE_REQUEST_DELAY', '2000')) || 2000;
    const requestDelayJitter = Number(this.configService.get<string>('SCRAPE_REQUEST_DELAY_JITTER', '1000')) || 1000;
    const productDelay = Number(this.configService.get<string>('SCRAPE_PRODUCT_DELAY_BASE_MS', '3500')) || 3500;
    const productDelayJitter = Number(this.configService.get<string>('SCRAPE_PRODUCT_DELAY_JITTER_MS', '2000')) || 2000;
    const productBackoffFactor = Number(this.configService.get<string>('SCRAPE_PRODUCT_BACKOFF_FACTOR', '2')) || 2;
    const superProxyHost = this.configService.get<string>('SCRAPE_SUPER_PROXY_HOST', 'proxy.scrape.do');
    const superProxyPort = Number(this.configService.get<string>('SCRAPE_SUPER_PROXY_PORT', '8080')) || 8080;
    const superProxyPassword = this.configService.get<string>('SCRAPE_SUPER_PROXY_PASSWORD', 'super=true');
    const sessionIsolation = this.configService.get<string>('SCRAPE_SESSION_ISOLATION', 'false') === 'true';

    this.config = {
      baseUrl: this.configService.get<string>('ALLEGRO_BASE_URL', 'https://allegro.pl'),
      proxyToken: primaryProxyToken || proxyTokens?.[0],
      proxyTokens: proxyTokens?.length ? proxyTokens : undefined,
      userAgent: this.configService.get<string>('SCRAPE_USER_AGENT') || undefined,
      maxRetries: Number(this.configService.get<string>('SCRAPE_MAX_RETRIES', '3')) || 3,
      requestDelay,
      requestDelayJitter,
      requestTimeout: Number(this.configService.get<string>('SCRAPE_REQUEST_TIMEOUT', '45000')) || 45000,
      productPageTimeout: Number(this.configService.get<string>('SCRAPE_PRODUCT_TIMEOUT', '60000')) || 60000,
      productRequestDelay: productDelay,
      productRequestDelayJitter: productDelayJitter,
      productRetryBackoffFactor: productBackoffFactor,
      superProxyHost,
      superProxyPort,
      superProxyPassword,
      sessionIsolation,
    };

    if (!this.config.proxyToken) {
      throw new Error('SCRAPE_DO_TOKEN environment variable is required');
    }

    this.httpClient = new ScrapingHttpClient(this.config);
  }

  /**
   * Get next AutoRiven Product ID and increment counter
   */
  private getNextAutoRivenProductId(): number {
    return this.autoRivenProductIdCounter++;
  }

  /**
   * Scrape all products from all categories in database
   */
  async scrapeAllProducts(options?: ProductScrapingOptions): Promise<ProductScrapingResult> {
    this.logger.log('🛍️ Starting comprehensive product scraping from all categories...');
    
    // Reset product ID counter
    this.autoRivenProductIdCounter = 10000;
    
    const startTime = new Date();
    let totalProductsScraped = 0;
    const allProductsForJson: ScrapedProduct[] = []; // Collect for JSON if enabled
    
    // Get all categories and subcategories from database
    const categories = await this.categoryRepository.find();
    const subcategories = await this.subcategoryRepository.find();
    
    this.logger.log(`📦 Found ${categories.length} categories and ${subcategories.length} subcategories`);
    
    // Scrape products from each subcategory (subcategories contain actual products)
    for (const subcategory of subcategories) {
      if (!subcategory.hasProducts) {
        continue;
      }
      
      this.logger.log(`🔍 Scraping products from: ${subcategory.name} (${subcategory.allegroUrl})`);
      
      try {
        const products = await this.scrapeProductsFromCategory(
          subcategory.allegroUrl,
          subcategory.id,
          options?.maxProducts,
          true, // Save in real-time
        );
        
        if (options?.saveJson) {
          allProductsForJson.push(...products);
        }
        
        totalProductsScraped += products.length;
        this.logger.log(`✅ Scraped and saved ${products.length} products from ${subcategory.name} (Total: ${totalProductsScraped})`);
        
        // Delay between categories to avoid rate limiting
        await this.pauseBetweenProductRequests(2);
      } catch (error) {
        this.logger.error(`❌ Failed to scrape ${subcategory.name}: ${error.message}`);
      }
    }
    
    const result: ProductScrapingResult = {
      scrapedAt: startTime.toISOString(),
      totalProducts: totalProductsScraped,
      method: 'Comprehensive scraping from all database categories',
      products: options?.saveJson ? allProductsForJson : [], // Include products if JSON requested
    };
    
    // Save JSON file if requested
    if (options?.saveJson && allProductsForJson.length > 0) {
      this.saveProductResultsToJson(result);
    }
    
    this.logger.log(`✅ Product scraping completed. Total products: ${totalProductsScraped}`);
    
    return result;
  }

  /**
   * Scrape products from a specific category
   */
  async scrapeProductsByCategory(
    categoryId: string,
    options?: ProductScrapingOptions,
  ): Promise<ProductScrapingResult> {
    this.logger.log(`🔍 Scraping products from category ID: ${categoryId}`);
    
    // Reset product ID counter
    this.autoRivenProductIdCounter = 10000;
    
    const startTime = new Date();
    
    // Find category or subcategory
    let categoryUrl: string;
    let categoryName: string;
    let dbCategoryId: string;
    
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
    const subcategory = await this.subcategoryRepository.findOne({ where: { id: categoryId } });
    
    if (category) {
      categoryUrl = category.allegroUrl;
      categoryName = category.name;
      dbCategoryId = category.id;
    } else if (subcategory) {
      categoryUrl = subcategory.allegroUrl;
      categoryName = subcategory.name;
      dbCategoryId = subcategory.id;
    } else {
      throw new Error(`Category not found with ID: ${categoryId}`);
    }
    
    this.logger.log(`📦 Scraping from: ${categoryName}`);
    
    const products = await this.scrapeProductsFromCategory(
      categoryUrl, 
      dbCategoryId, 
      options?.maxProducts, 
      true,
    );
    
    const result: ProductScrapingResult = {
      scrapedAt: startTime.toISOString(),
      totalProducts: products.length,
      categoryName,
      categoryId: dbCategoryId,
      method: `Scraping from specific category: ${categoryName}`,
      products: options?.saveJson ? products : [], // Include products if JSON requested
    };
    
    // Save JSON file if requested
    if (options?.saveJson && products.length > 0) {
      this.saveProductResultsToJson(result);
    }
    
    this.logger.log(`✅ Scraped and saved ${products.length} products from ${categoryName}`);
    
    return result;
  }

  /**
   * Scrape a specific product by Allegro offer ID
   */
  async scrapeProductByOfferId(offerId: string): Promise<ScrapedProduct> {
    this.logger.log(`🔍 Scraping product with offer ID: ${offerId}`);
    
    const productUrl = `https://allegro.pl/oferta/${offerId}`;
    const sessionKey = `offer-${offerId}`;
    
    try {
      const html = await this.httpClient.get(productUrl, {
        timeout: this.config.productPageTimeout ?? this.config.requestTimeout ?? 60000,
        sessionKey,
        headers: {
          Referer: this.config.baseUrl,
        },
      });
      const product = this.parseProductDetails(html, productUrl);
      
      this.logger.log(`✅ Successfully scraped product: ${product.name}`);
      
      return product;
    } catch (error) {
      this.logger.error(`❌ Failed to scrape product ${offerId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scrape products from a category URL
   * Always visits individual product pages to get complete details
   */
  private async scrapeProductsFromCategory(
    categoryUrl: string,
    categoryId: string,
    maxProducts?: number,
    saveRealTime: boolean = false,
  ): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    let hasMorePages = true;
    const sessionKey = `category-${categoryId}`;
    
    while (hasMorePages && (!maxProducts || products.length < maxProducts)) {
      try {
        const pageUrl = page === 1 ? categoryUrl : `${categoryUrl}?p=${page}`;
        this.logger.debug(`📄 Fetching page ${page}: ${pageUrl}`);
        
        const html = await this.httpClient.get(pageUrl, {
          timeout: this.config.requestTimeout ?? 45000,
          sessionKey,
        });
        
        // Parse listing page to get product URLs only
        const productUrls = this.parseProductUrls(html);
        
        if (productUrls.length === 0) {
          hasMorePages = false;
          break;
        }
        
        this.logger.debug(`🔍 Found ${productUrls.length} product URLs, visiting each page for complete details...`);
        
        const pageProducts: ScrapedProduct[] = [];
        
        // Visit each individual product page to get complete details
        for (let i = 0; i < productUrls.length; i++) {
          try {
            if (i > 0) {
              await this.pauseBetweenProductRequests();
            }
            const productUrl = productUrls[i];
            this.logger.debug(`📋 Fetching details for product ${i + 1}/${productUrls.length}: ${productUrl}`);
            
            const productPageHtml = await this.httpClient.get(productUrl, {
              timeout: this.config.productPageTimeout ?? this.config.requestTimeout ?? 60000,
              sessionKey,
              headers: {
                Referer: pageUrl,
              },
            });
            const product = this.parseProductDetails(productPageHtml, productUrl, categoryId);
            
            pageProducts.push(product);
          } catch (error) {
            this.logger.warn(`⚠️ Failed to fetch details for ${productUrls[i]}: ${error.message}`);
            await this.pauseBetweenProductRequests(this.config.productRetryBackoffFactor ?? 2);
            // Continue with next product
          }
        }
        
        // Save products immediately if real-time saving is enabled
        if (saveRealTime && pageProducts.length > 0) {
          await this.saveProductsToDatabase(pageProducts);
          this.logger.debug(`💾 Saved ${pageProducts.length} products from page ${page} to database`);
        }
        
        products.push(...pageProducts);
        this.logger.debug(`✅ Scraped ${pageProducts.length} products from page ${page}`);
        
        // Check if we've reached the max
        if (maxProducts && products.length >= maxProducts) {
          hasMorePages = false;
        }
        
        page++;
        
        // Delay between pages with jitter
        await this.pauseBetweenProductRequests(1.5);
      } catch (error) {
        this.logger.error(`❌ Error scraping page ${page}: ${error.message}`);
        hasMorePages = false;
      }
    }
    
    return maxProducts ? products.slice(0, maxProducts) : products;
  }

  /**
   * Parse product URLs from category listing page
   * Only extracts URLs, actual data comes from individual product pages
   */
  private parseProductUrls(html: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];
    
    this.logger.debug(`Parsing HTML of length: ${html.length} characters for product URLs`);
    
    // Find the main container with products
    let itemsContainer = $('div[data-box-name="product listing items"]');
    
    // If container not found, try alternative selectors
    if (itemsContainer.length === 0) {
      this.logger.debug('Trying alternative selectors for product container...');
      itemsContainer = $('.opbox-listing');
    }
    
    // Find all product articles
    const articlesToProcess = itemsContainer.length > 0 
      ? itemsContainer.find('article') 
      : $('article');
    
    this.logger.debug(`Found ${articlesToProcess.length} article elements`);
    
    if (articlesToProcess.length === 0) {
      this.logger.warn('No product articles found on page');
      return urls;
    }
    
    articlesToProcess.each((_, element) => {
      try {
        const $article = $(element);
        
        // Try multiple methods to extract clean product URL
        let productUrl: string | undefined;
        
        // Method 1: Extract from data-role attribute (most reliable)
        const offerLink = $article.find('a[data-role="offer"]').first();
        if (offerLink.length > 0) {
          productUrl = offerLink.attr('href');
        }
        
        // Method 2: Extract from h2 link and clean tracking URLs
        if (!productUrl) {
          const titleLink = $article.find('h2 a').first();
          let rawUrl = titleLink.attr('href');
          
          if (rawUrl) {
            // Check if this is a tracking/redirect URL
            if (rawUrl.includes('/events/clicks') && rawUrl.includes('redirect=')) {
              // Extract the actual URL from redirect parameter
              try {
                const url = new URL(rawUrl, 'https://allegro.pl');
                const redirectParam = url.searchParams.get('redirect');
                if (redirectParam) {
                  productUrl = decodeURIComponent(redirectParam);
                }
              } catch (e) {
                this.logger.debug(`Failed to parse tracking URL: ${e.message}`);
              }
            } else {
              productUrl = rawUrl;
            }
          }
        }
        
        // Method 3: Look for any direct product link pattern
        if (!productUrl) {
          const directLink = $article.find('a[href*="/oferta/"]').first();
          if (directLink.length > 0) {
            let rawUrl = directLink.attr('href');
            // Filter out tracking URLs
            if (rawUrl && !rawUrl.includes('/events/clicks')) {
              productUrl = rawUrl;
            }
          }
        }
        
        if (productUrl) {
          // Ensure full URL
          if (!productUrl.startsWith('http')) {
            productUrl = `https://allegro.pl${productUrl}`;
          }
          
          // Remove query parameters to get clean product URL
          try {
            const url = new URL(productUrl);
            // Keep only the base URL without tracking parameters
            productUrl = `${url.origin}${url.pathname}`;
          } catch (e) {
            // If URL parsing fails, use as-is
          }
          
          urls.push(productUrl);
        } else {
          this.logger.debug(`Could not extract clean URL from article`);
        }
      } catch (error) {
        this.logger.debug(`Failed to extract URL from article: ${error.message}`);
      }
    });
    
    this.logger.debug(`📦 Extracted ${urls.length} product URLs from listing page`);
    return urls;
  }

  /**
   * Parse product listings from category page HTML
   * Based on current Allegro HTML structure (October 2025)
   * @deprecated Use parseProductUrls + parseProductDetails instead for complete data
   */
  private parseProductListings(html: string, categoryId: string): ScrapedProduct[] {
    const $ = cheerio.load(html);
    const products: ScrapedProduct[] = [];
    
    this.logger.debug(`Parsing HTML of length: ${html.length} characters`);
    
    // Find the main container with products - Updated selector
    let itemsContainer = $('div[data-box-name="product listing items"]');
    
    // If container not found, try alternative selectors
    if (itemsContainer.length === 0) {
      this.logger.warn('Could not find product listing container with data-box-name="product listing items"');
      this.logger.debug('Trying alternative selectors...');
      
      // Try opbox-listing
      itemsContainer = $('.opbox-listing');
      if (itemsContainer.length > 0) {
        this.logger.debug('Found .opbox-listing container');
      } else {
        // Just try to find any articles
        this.logger.warn('No opbox-listing found either, will search for articles directly');
      }
    } else {
      this.logger.debug(`Found product listing container`);
    }
    
    // Allegro uses <article> tags for each product listing (inside <li> elements)
    const articlesToProcess = itemsContainer.length > 0 
      ? itemsContainer.find('article') 
      : $('article');
    
    this.logger.debug(`Found ${articlesToProcess.length} article elements`);
    
    if (articlesToProcess.length === 0) {
      // Debug: check what we do have
      this.logger.warn('No articles found! Debugging HTML structure...');
      this.logger.debug(`Sample HTML snippet: ${html.substring(0, 500)}`);
      return products;
    }
    
    articlesToProcess.each((_, element) => {
      try {
        const $article = $(element);
        
        // Extract product title from <h2><a> structure
        const titleLink = $article.find('h2 a').first();
        const name = titleLink.text().trim();
        
        // Extract URL - handle both direct links and event tracking links
        let allegroUrl = titleLink.attr('href') || '';
        
        // If it's an event tracking URL, extract the actual offer URL
        if (allegroUrl.includes('/events/clicks')) {
          const redirectMatch = allegroUrl.match(/redirect=([^&]+)/);
          if (redirectMatch) {
            allegroUrl = decodeURIComponent(redirectMatch[1]);
          }
        }
        
        // Extract offer ID from URL (format: /oferta/title-OFFERID or /oferta/OFFERID)
        let allegroId = '';
        const offerIdMatch = allegroUrl.match(/\/oferta\/[^\/]*?-?(\d+)(?:\?|$)/);
        if (offerIdMatch) {
          allegroId = offerIdMatch[1];
        }
        
        // Extract price - look for the price span with specific structure
        let price = 0;
        const priceContainer = $article.find('p[aria-label*="aktualna cena"]');
        if (priceContainer.length > 0) {
          const priceText = priceContainer.text().trim();
          price = this.extractPrice(priceText);
        }
        
        // Extract images - get all images from the image carousel
        const images: string[] = [];
        $article.find('ul img').each((_, img) => {
          const imgSrc = $(img).attr('src');
          if (imgSrc && imgSrc.includes('allegroimg.com')) {
            // Get the highest quality version
            const highQualityUrl = imgSrc.replace(/\/s\d+\//, '/original/');
            if (!images.includes(highQualityUrl)) {
              images.push(highQualityUrl);
            }
          }
        });
        
        // Extract product attributes (Stan, Producent części, etc.)
        const attributes: Record<string, string> = {};
        $article.find('dl dt').each((_, dt) => {
          const $dt = $(dt);
          const key = $dt.text().trim();
          const $dd = $dt.next('dd');
          if ($dd.length > 0) {
            attributes[key] = $dd.text().trim();
          }
        });
        
        // Extract rating if available
        let rating = 0;
        const ratingElement = $article.find('[aria-label*="na 5"]');
        if (ratingElement.length > 0) {
          const ratingText = ratingElement.attr('aria-label') || '';
          const ratingMatch = ratingText.match(/([\d,]+)\s+na\s+5/);
          if (ratingMatch) {
            rating = parseFloat(ratingMatch[1].replace(',', '.'));
          }
        }
        
        // Extract number of reviews
        let reviewCount = 0;
        const reviewElement = ratingElement.find('span.mpof_uk');
        if (reviewElement.length > 0) {
          const reviewText = reviewElement.text().trim();
          const reviewMatch = reviewText.match(/\((\d+)\)/);
          if (reviewMatch) {
            reviewCount = parseInt(reviewMatch[1], 10);
          }
        }
        
        // Check if product is in stock (sponsored products and regular listings are generally in stock)
        const inStock = true; // Allegro typically only shows available products
        
        // Check if free delivery
        const hasFreeDelivery = $article.text().includes('darmowa dostawa');
        
        if (name && allegroUrl && allegroId) {
          const autoRivenId = this.getNextAutoRivenProductId();
          const slug = createSlug(name);
          const englishSlug = createEnglishSlug(name);
          const englishUrl = createAutoRivenUrl(englishSlug, autoRivenId, 'product');
          
          // Translate condition to English
          const polishCondition = attributes['Stan'] || 'Unknown';
          const translatedCondition = translateCondition(polishCondition);
          
          products.push({
            allegroId,
            autoRivenId,
            name,
            nameEn: translateCategory(name),
            slug,
            englishSlug,
            allegroUrl,
            englishUrl,
            price,
            currency: 'PLN',
            images,
            subcategoryId: categoryId,
            inStock,
            condition: translatedCondition, // Use translated condition
            manufacturer: attributes['Producent części'] || null,
            partNumber: attributes['Numer katalogowy części'] || null,
            rating,
            reviewCount,
            freeDelivery: hasFreeDelivery,
          });
          
          this.logger.debug(`✅ Parsed: ${name} (${allegroId}) - ${price} PLN - ${images.length} images - Condition: ${translatedCondition}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to parse product listing: ${error.message}`);
      }
    });
    
    this.logger.log(`📦 Parsed ${products.length} products from page`);
    return products;
  }

  /**
   * Parse detailed product information from product page
   * Based on actual Allegro HTML structure (October 2025)
   * This method extracts comprehensive product details including gallery, description HTML, EAN, brand, model, year
   */
  private parseProductDetails(html: string, productUrl: string, categoryId?: string): ScrapedProduct {
    const $ = cheerio.load(html);
    
    // Extract offer ID from URL
    const offerIdMatch = productUrl.match(/\/oferta\/[^\/]*?-?(\d+)(?:\?|$)/);
    const allegroId = offerIdMatch ? offerIdMatch[1] : '';
    
    // Product name from h1 tag (most reliable based on actual HTML)
    const name = $('h1.mgn2_21').first().text().trim() || 
                 $('h1').first().text().trim() ||
                 'Unknown Product';
    
    // Price from meta tag
    const priceText = $('meta[itemprop="price"]').attr('content') || '0';
    const price = this.extractPrice(priceText);
    
    // Brand from meta tag (confirmed in HTML at line 9670)
    const brand = $('meta[itemprop="brand"]').attr('content')?.trim() || '';
    
    // Gallery images from thumbnail buttons - convert from s128 to original
    const galleryImages: string[] = [];
    const seenUrls = new Set<string>();
    
    // Get images from gallery thumbnails (actual pattern in HTML)
    $('button img[src*="allegroimg.com/s128/"]').each((_, img) => {
      let src = $(img).attr('src');
      if (src) {
        // Convert thumbnail to original size
        src = src.replace(/\/s128\//, '/original/');
        if (!seenUrls.has(src)) {
          seenUrls.add(src);
          galleryImages.push(src);
        }
      }
    });
    
    // Also check for images in description with data-src attribute
    $('div[itemprop="description"] img[data-src*="allegroimg.com"]').each((_, img) => {
      let src = $(img).attr('data-src');
      if (src && src.includes('/original/')) {
        if (!seenUrls.has(src)) {
          seenUrls.add(src);
          galleryImages.push(src);
        }
      }
    });
    
    // Primary image is the first gallery image
    const images = galleryImages.slice(0, 1);
    
    // Description HTML from Description section (preserves formatting and images)
    let descriptionHtml = '';
    const descriptionContainer = $('div[itemprop="description"]');
    if (descriptionContainer.length > 0) {
      descriptionHtml = descriptionContainer.html()?.trim() || '';
    }
    
    // Plain text description
    let description = '';
    if (descriptionContainer.length > 0) {
      description = descriptionContainer
        .text()
        .trim()
        .replace(/\s+/g, ' ')
        .substring(0, 1000); // Limit to 1000 chars
    }
    
    // Extract parameters from the Parameters table (actual HTML structure)
    let model: string | undefined;
    let year: number | undefined;
    let ean: string | undefined;
    let conditionPolish = 'Unknown';
    let manufacturer: string | null = brand || null;
    let partNumber: string | null = null;
    
    const specifications: Record<string, any> = {};
    
    // Parse parameters table (actual structure from HTML)
    $('div[data-box-name="Parameters"] table tbody tr').each((_, row) => {
      const label = $(row).find('td').first().text().trim();
      const value = $(row).find('td').last().text().trim();
      
      const labelLower = label.toLowerCase();
      
      // Store in specifications
      specifications[label] = value;
      
      // Extract specific fields
      if (labelLower.includes('stan')) {
        conditionPolish = value;
      } else if (labelLower.includes('producent części') || labelLower.includes('marka')) {
        manufacturer = value;
      } else if (labelLower.includes('numer katalogowy')) {
        partNumber = value;
        // This could be EAN if it's all digits
        if (!ean && value.match(/^\d+$/)) {
          ean = value;
        }
      } else if (labelLower.includes('rok produkcji') || labelLower.includes('rocznik')) {
        const yearMatch = value.match(/\d{4}/);
        if (yearMatch) {
          year = parseInt(yearMatch[0], 10);
        }
      }
    });
    
    // Try to extract EAN from image alt text as fallback (confirmed pattern in HTML)
    if (!ean) {
      $('img[alt*="EAN"]').each((_, img) => {
        const altText = $(img).attr('alt') || '';
        const eanMatch = altText.match(/EAN\s*\(GTIN\)\s*(\d+)/i);
        if (eanMatch) {
          ean = eanMatch[1];
          return false; // break
        }
      });
    }
    
    // Extract model from description text
    if (!model) {
      const modelMatch = description.match(/(?:Numer modelu produktu|Model)[:\s]+([A-Z0-9\-]+)/i);
      if (modelMatch) {
        model = modelMatch[1];
      }
    }
    
    // Seller information
    let sellerName = '';
    let sellerRating = 0;
    
    // Extract seller name
    const sellerText = $('div[data-box-name="showoffer.sellerInfoHeader"] div[class*="mp0t_ji"]').text().trim();
    const sellerMatch = sellerText.match(/od\s+(.+)/);
    if (sellerMatch) {
      sellerName = sellerMatch[1].trim();
    }
    
    // Extract seller rating (format: "poleca 99,2%")
    const sellerRatingText = $('a[data-analytics-click-label="sellerRating"]').text().trim();
    const ratingMatch = sellerRatingText.match(/poleca\s+([\d,]+)%/);
    if (ratingMatch) {
      const ratingPercent = parseFloat(ratingMatch[1].replace(',', '.'));
      sellerRating = (ratingPercent / 100) * 5;
    }
    
    // Translate condition from Polish to English
    const translatedCondition = translateCondition(conditionPolish);
    
    const autoRivenId = this.getNextAutoRivenProductId();
    const slug = createSlug(name);
    const englishSlug = createEnglishSlug(name);
    const englishUrl = createAutoRivenUrl(englishSlug, autoRivenId, 'product');
    
    return {
      allegroId,
      autoRivenId,
      name,
      nameEn: translateCategory(name),
      slug,
      englishSlug,
      allegroUrl: productUrl,
      englishUrl,
      price,
      currency: 'PLN',
      description: description || undefined,
      descriptionHtml: descriptionHtml || undefined,
      brand: brand || undefined,
      manufacturer,
      partNumber,
      model: model || undefined,
      year: year || undefined,
      condition: translatedCondition,
      images: images.length > 0 ? images : [],
      galleryImages,
      ean: ean || undefined,
      sellerName,
      sellerRating,
      specifications,
      inStock: true,
      subcategoryId: categoryId,
    };
  }

  /**
   * Extract numeric price from price string
   */
  private extractPrice(priceText: string): number {
    const cleaned = priceText.replace(/[^\d,]/g, '').replace(',', '.');
    const price = parseFloat(cleaned);
    return isNaN(price) ? 0 : price;
  }

  /**
   * Save products to database
   */
  async saveProductsToDatabase(products: ScrapedProduct[]): Promise<void> {
    if (products.length === 0) {
      return;
    }
    
    this.logger.debug(`💾 Saving ${products.length} products to database...`);
    
    let savedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        // Check if product already exists (by allegroId or autoRivenId)
        let existingProduct = await this.productRepository.findOne({
          where: [
            { allegroId: product.allegroId },
            { autoRivenId: product.autoRivenId },
          ],
        });
        
        if (existingProduct) {
          // Update existing product
          Object.assign(existingProduct, {
            name: product.name,
            nameEn: product.nameEn,
            slug: product.slug,
            englishSlug: product.englishSlug,
            allegroUrl: product.allegroUrl,
            englishUrl: product.englishUrl,
            price: product.price,
            currency: product.currency,
            description: product.description,
            descriptionHtml: product.descriptionHtml,
            brand: product.brand,
            manufacturer: product.manufacturer,
            partNumber: product.partNumber,
            condition: product.condition,
            rating: product.rating,
            reviewCount: product.reviewCount,
            freeDelivery: product.freeDelivery,
            images: product.images,
            galleryImages: product.galleryImages,
            ean: product.ean,
            sellerName: product.sellerName,
            sellerRating: product.sellerRating,
            specifications: product.specifications,
            subcategoryId: product.subcategoryId,
            categoryId: product.categoryId,
            inStock: product.inStock,
            lastScrapedAt: new Date(),
          });
          
          await this.productRepository.save(existingProduct);
          updatedCount++;
        } else {
          // Create new product
          const newProduct = this.productRepository.create({
            allegroId: product.allegroId,
            autoRivenId: product.autoRivenId,
            name: product.name,
            nameEn: product.nameEn,
            slug: product.slug,
            englishSlug: product.englishSlug,
            allegroUrl: product.allegroUrl,
            englishUrl: product.englishUrl,
            price: product.price,
            currency: product.currency,
            description: product.description,
            descriptionHtml: product.descriptionHtml,
            brand: product.brand,
            manufacturer: product.manufacturer,
            partNumber: product.partNumber,
            condition: product.condition,
            rating: product.rating,
            reviewCount: product.reviewCount,
            freeDelivery: product.freeDelivery,
            images: product.images,
            galleryImages: product.galleryImages,
            ean: product.ean,
            sellerName: product.sellerName,
            sellerRating: product.sellerRating,
            specifications: product.specifications,
            subcategoryId: product.subcategoryId,
            categoryId: product.categoryId,
            inStock: product.inStock,
            isActive: true,
            lastScrapedAt: new Date(),
          });
          
          await this.productRepository.save(newProduct);
          savedCount++;
        }
      } catch (error) {
        errorCount++;
        this.logger.error(`❌ Failed to save product ${product.name}: ${error.message}`);
      }
    }
    
    // Log summary
    if (savedCount > 0 || updatedCount > 0) {
      this.logger.log(`✅ Database: +${savedCount} new, ~${updatedCount} updated${errorCount > 0 ? `, ❌${errorCount} errors` : ''}`);
    }
  }

  /**
   * Save product scraping results to JSON file
   * Useful for translation reference and debugging
   */
  private saveProductResultsToJson(result: ProductScrapingResult): void {
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `products-${timestamp}.json`;
      const filepath = join(process.cwd(), 'results', filename);
      
      writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf-8');
      this.logger.log(`📄 Saved JSON results to: ${filepath}`);
    } catch (error) {
      this.logger.error(`❌ Failed to save JSON results: ${error.message}`);
    }
  }

  private computeProductDelay(multiplier = 1): number {
    const baseDelay = this.config.productRequestDelay ?? 3500;
    const jitterMax = this.config.productRequestDelayJitter ?? 2000;
    const jitter = Math.random() * jitterMax;
    return Math.max(500, Math.round(baseDelay * multiplier + jitter));
  }

  private async pauseBetweenProductRequests(multiplier = 1): Promise<void> {
    const delayDuration = this.computeProductDelay(multiplier);
    this.logger.debug(`⏱️ Pausing ${delayDuration}ms before next product request`);
    await this.delay(delayDuration);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
