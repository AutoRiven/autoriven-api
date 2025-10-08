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
    this.config = {
      baseUrl: this.configService.get<string>('ALLEGRO_BASE_URL', 'https://allegro.pl'),
      proxyToken: this.configService.get<string>('SCRAPE_DO_TOKEN'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      maxRetries: 3,
      requestDelay: 2000,
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
        await this.delay(3000);
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
    
    try {
      const html = await this.httpClient.get(productUrl);
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
    
    while (hasMorePages && (!maxProducts || products.length < maxProducts)) {
      try {
        const pageUrl = page === 1 ? categoryUrl : `${categoryUrl}?p=${page}`;
        this.logger.debug(`📄 Fetching page ${page}: ${pageUrl}`);
        
        const html = await this.httpClient.get(pageUrl);
        
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
            const productUrl = productUrls[i];
            this.logger.debug(`📋 Fetching details for product ${i + 1}/${productUrls.length}: ${productUrl}`);
            
            const productPageHtml = await this.httpClient.get(productUrl);
            const product = this.parseProductDetails(productPageHtml, productUrl, categoryId);
            
            pageProducts.push(product);
            
            // Delay between product page visits to avoid rate limiting
            await this.delay(1500);
          } catch (error) {
            this.logger.warn(`⚠️ Failed to fetch details for ${productUrls[i]}: ${error.message}`);
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
        
        // Delay between pages
        await this.delay(2000);
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
   * Based on current Allegro HTML structure (October 2025)
   * This method extracts comprehensive product details including gallery, description HTML, EAN, and seller info
   */
  private parseProductDetails(html: string, productUrl: string, categoryId?: string): ScrapedProduct {
    const $ = cheerio.load(html);
    
    // Extract offer ID from URL
    const offerIdMatch = productUrl.match(/\/oferta\/[^\/]*?-?(\d+)(?:\?|$)/);
    const allegroId = offerIdMatch ? offerIdMatch[1] : '';
    
    // Product name from meta tag (most reliable)
    const name = $('meta[itemprop="name"]').attr('content') || 
                 $('h1[data-role="title"]').text().trim() || 
                 $('h1[itemprop="name"]').text().trim();
    
    // Price from meta tag
    const priceText = $('meta[itemprop="price"]').attr('content') || '0';
    const price = this.extractPrice(priceText);
    
    // Gallery images from showoffer.gallery section
    const galleryImages: string[] = [];
    $('div[data-box-name="showoffer.gallery"] img').each((_, img) => {
      const imgSrc = $(img).attr('src') || $(img).attr('data-src');
      if (imgSrc && imgSrc.includes('allegroimg.com')) {
        // Get the highest quality version
        const highQualityUrl = imgSrc.replace(/\/s\d+\//, '/original/');
        if (!galleryImages.includes(highQualityUrl)) {
          galleryImages.push(highQualityUrl);
        }
      }
    });
    
    // Also check for data-srcset which often contains original URLs
    $('div[data-box-name="showoffer.gallery"] img[data-srcset]').each((_, img) => {
      const srcset = $(img).attr('data-srcset') || '';
      const originalMatch = srcset.match(/https:\/\/[^\s]+\/original\/[^\s]+/);
      if (originalMatch) {
        const originalUrl = originalMatch[0];
        if (!galleryImages.includes(originalUrl)) {
          galleryImages.push(originalUrl);
        }
      }
    });
    
    // Fallback to regular images array if gallery is empty
    const images: string[] = [];
    if (galleryImages.length === 0) {
      $('img[data-role="gallery-image"], img[itemprop="image"]').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && !images.includes(src)) {
          images.push(src);
        }
      });
    }
    
    // Description HTML from Description section (preserves formatting and images)
    let descriptionHtml = '';
    const descriptionContainer = $('div[data-box-name="Description"] div[itemprop="description"]');
    if (descriptionContainer.length > 0) {
      descriptionHtml = descriptionContainer.html() || '';
    }
    
    // Plain text description for backwards compatibility
    const description = descriptionContainer.text().trim() || '';
    
    // EAN/GTIN from meta tag or image alt text
    let ean = $('meta[itemprop="gtin"]').attr('content') || '';
    if (!ean) {
      // Try to extract from image alt text (format: "EAN (GTIN) 0840349928319")
      $('img[alt*="EAN"]').each((_, img) => {
        const altText = $(img).attr('alt') || '';
        const eanMatch = altText.match(/EAN\s*\(GTIN\)\s*(\d+)/i);
        if (eanMatch) {
          ean = eanMatch[1];
          return false; // break
        }
      });
    }
    
    // Seller information
    let sellerName = '';
    let sellerRating = 0;
    
    // Extract seller name from sellerInfoHeader section
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
      // Convert percentage to 5-point scale (99.2% -> 4.96)
      sellerRating = (ratingPercent / 100) * 5;
    }
    
    // Brand from meta tag
    const brand = $('meta[itemprop="brand"]').attr('content') || '';
    
    // Specifications from parameters table or attributes
    const specifications: Record<string, any> = {};
    
    // Try structured parameters table first
    $('table[data-role="parameters"] tr').each((_, row) => {
      const key = $(row).find('td').first().text().trim();
      const value = $(row).find('td').last().text().trim();
      if (key && value) {
        specifications[key] = value;
      }
    });
    
    // Extract manufacturer and condition from image alt texts (Allegro's current pattern)
    let manufacturer = brand || null;
    let condition = 'Unknown';
    
    $('img[alt*="Producent"]').each((_, img) => {
      const altText = $(img).attr('alt') || '';
      const manufacturerMatch = altText.match(/Producent\s+części\s+(.+?)(?:\s|$)/i);
      if (manufacturerMatch) {
        manufacturer = manufacturerMatch[1].trim();
        return false;
      }
    });
    
    // Check condition from meta tag
    const conditionMeta = $('meta[itemprop="itemCondition"]').attr('content') || '';
    if (conditionMeta.includes('NewCondition')) {
      condition = 'Nowy';
    } else if (conditionMeta.includes('UsedCondition')) {
      condition = 'Używany';
    }
    
    // Translate condition to English
    const translatedCondition = translateCondition(condition);
    
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
      description,
      descriptionHtml,
      brand,
      manufacturer,
      condition: translatedCondition, // Use translated condition
      images: galleryImages.length > 0 ? galleryImages.slice(0, 3) : images.slice(0, 3), // First 3 for compatibility
      galleryImages, // Full gallery
      ean,
      sellerName,
      sellerRating,
      specifications,
      inStock: true,
      subcategoryId: categoryId, // Add categoryId if provided
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

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
