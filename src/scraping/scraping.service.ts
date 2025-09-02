import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapingResult {
  success: boolean;
  data?: any;
  error?: string;
  url?: string;
}

export interface AllegroCategory {
  name: string;
  url: string;
  id?: string;
  subcategories?: AllegroSubcategory[];
}

export interface AllegroSubcategory {
  name: string;
  url: string;
  id?: string;
  categoryId?: string;
}

export interface AllegroProduct {
  name: string;
  url: string;
  id?: string;
  price?: string;
  currency?: string;
  brand?: string;
  model?: string;
  images?: string[];
  description?: string;
  specifications?: Record<string, any>;
  categoryId?: string;
  subcategoryId?: string;
}

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  private readonly scrapeDoToken: string;
  private readonly baseUrl = 'https://allegro.pl';

  constructor(private readonly configService: ConfigService) {
    this.scrapeDoToken = this.configService.get<string>('SCRAPE_DO_TOKEN');
  }

  private async makeProxyRequest(targetUrl: string): Promise<AxiosResponse> {
    try {
      this.logger.debug(`Making proxy request to: ${targetUrl}`);
      
      const response = await axios({
        method: 'GET',
        url: targetUrl,
        proxy: {
          protocol: 'http',
          host: 'proxy.scrape.do',
          port: 8080,
          auth: {
            username: this.scrapeDoToken,
            password: '',
          },
        },
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      this.logger.debug(`Proxy request successful for: ${targetUrl}`);
      return response;
    } catch (error) {
      this.logger.error(`Proxy request failed for ${targetUrl}:`, error.message);
      throw error;
    }
  }

  async scrapeAllegroCategories(): Promise<ScrapingResult> {
    try {
      const targetUrl = `${this.baseUrl}/kategorie`;
      const response = await this.makeProxyRequest(targetUrl);
      
      const $ = cheerio.load(response.data);
      const categories: AllegroCategory[] = [];

      // Scrape main categories
      $('[data-role="categories-tree"] a[href*="/kategoria/"]').each((index, element) => {
        const $element = $(element);
        const name = $element.text().trim();
        const url = $element.attr('href');
        
        if (name && url) {
          // Extract category ID from URL if possible
          const idMatch = url.match(/\/kategoria\/([^\/\?]+)/);
          const id = idMatch ? idMatch[1] : undefined;
          
          categories.push({
            name,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            id,
          });
        }
      });

      // Also try alternative selectors for categories
      if (categories.length === 0) {
        $('.categories-list a, .category-link, [class*="category"] a').each((index, element) => {
          const $element = $(element);
          const name = $element.text().trim();
          const url = $element.attr('href');
          
          if (name && url && url.includes('kategoria')) {
            const idMatch = url.match(/\/kategoria\/([^\/\?]+)/);
            const id = idMatch ? idMatch[1] : undefined;
            
            categories.push({
              name,
              url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
              id,
            });
          }
        });
      }

      this.logger.log(`Scraped ${categories.length} categories from Allegro`);
      
      return {
        success: true,
        data: categories,
        url: targetUrl,
      };
    } catch (error) {
      this.logger.error('Failed to scrape Allegro categories:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async scrapeAllegroSubcategories(categoryUrl: string): Promise<ScrapingResult> {
    try {
      const response = await this.makeProxyRequest(categoryUrl);
      const $ = cheerio.load(response.data);
      const subcategories: AllegroSubcategory[] = [];

      // Extract category ID from URL
      const categoryIdMatch = categoryUrl.match(/\/kategoria\/([^\/\?]+)/);
      const categoryId = categoryIdMatch ? categoryIdMatch[1] : undefined;

      // Scrape subcategories
      $('[data-role="subcategories"] a[href*="/kategoria/"], .subcategory-link, [class*="subcategory"] a').each((index, element) => {
        const $element = $(element);
        const name = $element.text().trim();
        const url = $element.attr('href');
        
        if (name && url) {
          const idMatch = url.match(/\/kategoria\/([^\/\?]+)/);
          const id = idMatch ? idMatch[1] : undefined;
          
          subcategories.push({
            name,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            id,
            categoryId,
          });
        }
      });

      this.logger.log(`Scraped ${subcategories.length} subcategories from: ${categoryUrl}`);
      
      return {
        success: true,
        data: subcategories,
        url: categoryUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to scrape subcategories from ${categoryUrl}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async scrapeAllegroProducts(categoryUrl: string, page: number = 1, limit: number = 20): Promise<ScrapingResult> {
    try {
      const targetUrl = `${categoryUrl}?p=${page}&limit=${limit}`;
      const response = await this.makeProxyRequest(targetUrl);
      const $ = cheerio.load(response.data);
      const products: AllegroProduct[] = [];

      // Extract category/subcategory ID from URL
      const categoryIdMatch = categoryUrl.match(/\/kategoria\/([^\/\?]+)/);
      const categoryId = categoryIdMatch ? categoryIdMatch[1] : undefined;

      // Scrape products
      $('[data-role="offer"], .offer-item, [class*="offer"]').each((index, element) => {
        const $element = $(element);
        
        // Product name
        const nameElement = $element.find('h2 a, .offer-title a, [class*="title"] a').first();
        const name = nameElement.text().trim();
        const url = nameElement.attr('href');
        
        // Price
        const priceElement = $element.find('[class*="price"], .price').first();
        const priceText = priceElement.text().trim();
        const priceMatch = priceText.match(/([\d,]+\.?\d*)\s*(\w+)/);
        const price = priceMatch ? priceMatch[1].replace(',', '') : undefined;
        const currency = priceMatch ? priceMatch[2] : 'PLN';
        
        // Images
        const imageElement = $element.find('img').first();
        const imageUrl = imageElement.attr('src') || imageElement.attr('data-src');
        const images = imageUrl ? [imageUrl] : [];
        
        // Product ID from URL
        const idMatch = url ? url.match(/\/oferta\/([^\/\?]+)/) : null;
        const id = idMatch ? idMatch[1] : undefined;

        if (name && url) {
          products.push({
            name,
            url: url.startsWith('http') ? url : `${this.baseUrl}${url}`,
            id,
            price,
            currency,
            images,
            categoryId,
          });
        }
      });

      this.logger.log(`Scraped ${products.length} products from: ${targetUrl}`);
      
      return {
        success: true,
        data: products,
        url: targetUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to scrape products from ${categoryUrl}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async scrapeProductDetails(productUrl: string): Promise<ScrapingResult> {
    try {
      const response = await this.makeProxyRequest(productUrl);
      const $ = cheerio.load(response.data);
      
      // Extract product details
      const name = $('h1, .offer-title, [class*="title"]').first().text().trim();
      const description = $('.offer-description, [class*="description"] p').text().trim();
      
      // Price information
      const priceElement = $('[class*="price"], .price').first();
      const priceText = priceElement.text().trim();
      const priceMatch = priceText.match(/([\d,]+\.?\d*)\s*(\w+)/);
      const price = priceMatch ? priceMatch[1].replace(',', '') : undefined;
      const currency = priceMatch ? priceMatch[2] : 'PLN';
      
      // Images
      const images: string[] = [];
      $('[class*="gallery"] img, .offer-photos img, .product-images img').each((index, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src) {
          images.push(src);
        }
      });
      
      // Specifications
      const specifications: Record<string, any> = {};
      $('.offer-params tr, .specifications tr, [class*="spec"] tr').each((index, element) => {
        const key = $(element).find('td:first-child, th').text().trim();
        const value = $(element).find('td:last-child').text().trim();
        if (key && value) {
          specifications[key] = value;
        }
      });
      
      // Brand and model extraction
      const brand = specifications['Marka'] || specifications['Brand'] || '';
      const model = specifications['Model'] || '';

      const productDetails: AllegroProduct = {
        name,
        url: productUrl,
        price,
        currency,
        description,
        images,
        specifications,
        brand,
        model,
      };

      this.logger.log(`Scraped product details from: ${productUrl}`);
      
      return {
        success: true,
        data: productDetails,
        url: productUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to scrape product details from ${productUrl}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async testConnection(): Promise<ScrapingResult> {
    try {
      const testUrl = 'https://httpbin.org/anything';
      const response = await this.makeProxyRequest(testUrl);
      
      return {
        success: true,
        data: {
          message: 'Scrape.do connection successful',
          testResponse: response.data,
        },
        url: testUrl,
      };
    } catch (error) {
      this.logger.error('Scrape.do connection test failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
