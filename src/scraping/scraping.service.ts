import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CategoryTranslationService } from './services/translation.service';

export interface AllegroCategory {
  id: string;
  name: string;
  nameEn?: string; // English translation of the category name
  url: string;
  level: number; // 0=Category, 1=Subcategory, 2=Level1, 3=Level2, 4=Level3
  parentId?: string;
  subcategories?: AllegroCategory[];
  productCount?: number;
  hasProducts?: boolean;
}

export interface AllegroProduct {
  id: string;
  title: string;
  price: string;
  currency: string;
  imageUrl?: string;
  url: string;
  categoryId: string;
  seller: {
    name: string;
    rating?: string;
  };
  location?: string;
  condition?: string;
  specifications?: { [key: string]: string };
}

export interface ScrapingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  private readonly scrapeDoToken: string;
  private readonly baseUrl = 'https://allegro.pl';
  
  constructor(private configService: ConfigService) {
    this.scrapeDoToken = this.configService.get<string>('SCRAPE_DO_TOKEN', 'b70dd4da53294062b160bb6953ba0619f32185d1508');
  }

  /**
   * Fetch HTML content from a page
   */
  async fetchPageHtml(url: string): Promise<string> {
    try {
      this.logger.log(`Fetching page: ${url}`);
      const response = await this.makeProxiedRequest(url);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch page ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Make a request through scrape.do proxy
   */
  private async makeProxiedRequest(targetUrl: string): Promise<any> {
    try {
      this.logger.log(`Making proxied request to: ${targetUrl}`);
      
      const config = {
        method: 'GET' as const,
        url: targetUrl,
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      };

      // Add proxy configuration
      (config as any).proxy = {
        protocol: 'http',
        host: 'proxy.scrape.do',
        port: 8080,
        auth: {
          username: this.scrapeDoToken,
          password: ''
        }
      };

      const response = await axios(config);
      return response;
    } catch (error) {
      this.logger.error(`Error making proxied request to ${targetUrl}:`, error.message);
      throw error;
    }
  }

  /**
   * Extract categories from Allegro homepage or categories page
   */
  async scrapeCategoriesFromMainPage(): Promise<AllegroCategory[]> {
    try {
      this.logger.log('Starting to scrape Allegro categories...');
      
      // Try multiple category discovery approaches
      const categoryUrls = [
        `${this.baseUrl}/`,
        `${this.baseUrl}/kategoria`,
        `${this.baseUrl}/categories`
      ];
      
      for (const url of categoryUrls) {
        try {
          this.logger.log(`Trying to discover categories from: ${url}`);
          const response = await this.makeProxiedRequest(url);
          
          if (response.status !== 200) {
            this.logger.warn(`Failed to fetch ${url}, status: ${response.status}`);
            continue;
          }
          
          const html = response.data;
          const categories = this.parseCategoriesFromHtml(html);
          
          // Check if we got actual categories (not products)
          const validCategories = categories.filter(cat => 
            cat.url.includes('/kategoria/') && 
            !cat.url.includes('/oferta/') // Exclude product pages
          );
          
          if (validCategories.length > 0) {
            this.logger.log(`Found ${validCategories.length} valid categories from ${url}`);
            return validCategories;
          }
        } catch (error) {
          this.logger.warn(`Error fetching categories from ${url}:`, error.message);
          continue;
        }
      }
      
      // If no valid categories found, use known categories
      this.logger.warn('No valid categories found from HTML parsing, falling back to known categories');
      return await this.scrapeKnownCategories();
      
    } catch (error) {
      this.logger.error('Error scraping categories from main page:', error.message);
      throw error;
    }
  }
  
  /**
   * Fallback method to scrape from known major category URLs
   */
  private async scrapeKnownCategories(): Promise<AllegroCategory[]> {
    const knownCategories: AllegroCategory[] = [
      { 
        id: 'motoryzacja', 
        name: 'Motoryzacja', 
        nameEn: 'Automotive',
        url: `${this.baseUrl}/kategoria/motoryzacja`, 
        level: 0, 
        hasProducts: true 
      },
      { 
        id: 'dom-i-ogrod', 
        name: 'Dom i ogród', 
        nameEn: 'Home & Garden',
        url: `${this.baseUrl}/kategoria/dom-i-ogrod`, 
        level: 0, 
        hasProducts: true 
      },
      { 
        id: 'elektronika', 
        name: 'Elektronika', 
        nameEn: 'Electronics',
        url: `${this.baseUrl}/kategoria/elektronika`, 
        level: 0, 
        hasProducts: true 
      },
      { 
        id: 'moda', 
        name: 'Moda', 
        nameEn: 'Fashion',
        url: `${this.baseUrl}/kategoria/moda`, 
        level: 0, 
        hasProducts: true 
      },
      { 
        id: 'dziecko', 
        name: 'Dziecko', 
        nameEn: 'Baby & Kids',
        url: `${this.baseUrl}/kategoria/dziecko`, 
        level: 0, 
        hasProducts: true 
      },
      { 
        id: 'sport-i-turystyka', 
        name: 'Sport i turystyka', 
        nameEn: 'Sports & Recreation',
        url: `${this.baseUrl}/kategoria/sport-i-turystyka`, 
        level: 0, 
        hasProducts: true 
      },
      { 
        id: 'zdrowie', 
        name: 'Zdrowie', 
        nameEn: 'Health',
        url: `${this.baseUrl}/kategoria/zdrowie`, 
        level: 0, 
        hasProducts: true 
      },
      { 
        id: 'uroda', 
        name: 'Uroda', 
        nameEn: 'Beauty',
        url: `${this.baseUrl}/kategoria/uroda`, 
        level: 0, 
        hasProducts: true 
      },
      { 
        id: 'kultura-i-rozrywka', 
        name: 'Kultura i rozrywka', 
        nameEn: 'Culture & Entertainment',
        url: `${this.baseUrl}/kategoria/kultura-i-rozrywka`, 
        level: 0, 
        hasProducts: true 
      },
      { 
        id: 'allegro-lokalnie', 
        name: 'Allegro lokalnie', 
        nameEn: 'Allegro Local',
        url: `${this.baseUrl}/kategoria/allegro-lokalnie`, 
        level: 0, 
        hasProducts: true 
      },
      { 
        id: 'przemysl', 
        name: 'Przemysł', 
        nameEn: 'Industry',
        url: `${this.baseUrl}/kategoria/przemysl`, 
        level: 0, 
        hasProducts: true 
      },
      { 
        id: 'kolekcje-i-sztuka', 
        name: 'Kolekcje i sztuka', 
        nameEn: 'Collections & Art',
        url: `${this.baseUrl}/kategoria/kolekcje-i-sztuka`, 
        level: 0, 
        hasProducts: true 
      }
    ];
    
    this.logger.log(`Using ${knownCategories.length} known Allegro categories`);
    return knownCategories;
  }

  async scrapeCategories(): Promise<AllegroCategory[]> {
    try {
      // Use the new enhanced category scraping method
      return await this.scrapeCategoriesFromMainPage();
    } catch (error) {
      this.logger.error('Error scraping categories:', error.message);
      throw error;
    }
  }

  /**
   * Scrape subcategories for a specific category
   */
  async scrapeSubcategories(categoryUrl: string): Promise<ScrapingResult<AllegroCategory[]>> {
    try {
      this.logger.log(`Scraping subcategories for: ${categoryUrl}`);
      
      const response = await this.makeProxiedRequest(categoryUrl);
      const html = response.data;
      const subcategories = this.parseSubcategoriesFromHtml(html, categoryUrl);
      
      this.logger.log(`Found ${subcategories.length} subcategories`);
      
      return {
        success: true,
        data: subcategories,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Error scraping subcategories for ${categoryUrl}:`, error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Scrape products from a category or search results
   */
  async scrapeProducts(categoryUrl: string, limit = 50): Promise<ScrapingResult<AllegroProduct[]>> {
    try {
      this.logger.log(`Scraping products from: ${categoryUrl}`);
      
      // Add pagination parameter if needed
      const url = categoryUrl.includes('?') 
        ? `${categoryUrl}&limit=${limit}` 
        : `${categoryUrl}?limit=${limit}`;
      
      const response = await this.makeProxiedRequest(url);
      const html = response.data;
      const products = this.parseProductsFromHtml(html, categoryUrl);
      
      this.logger.log(`Found ${products.length} products`);
      
      return {
        success: true,
        data: products,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Error scraping products from ${categoryUrl}:`, error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Search for products by query
   */
  async searchProducts(query: string, limit = 50): Promise<ScrapingResult<AllegroProduct[]>> {
    try {
      this.logger.log(`Searching products for query: ${query}`);
      
      const searchUrl = `${this.baseUrl}/listing?string=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await this.makeProxiedRequest(searchUrl);
      const html = response.data;
      const products = this.parseProductsFromHtml(html);
      
      this.logger.log(`Found ${products.length} products for query: ${query}`);
      
      return {
        success: true,
        data: products,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Error searching products for query ${query}:`, error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get detailed product information
   */
  async scrapeProductDetails(productUrl: string): Promise<ScrapingResult<AllegroProduct>> {
    try {
      this.logger.log(`Scraping product details for: ${productUrl}`);
      
      const response = await this.makeProxiedRequest(productUrl);
      const html = response.data;
      const product = this.parseProductDetailsFromHtml(html, productUrl);
      
      this.logger.log(`Successfully scraped product details`);
      
      return {
        success: true,
        data: product,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(`Error scraping product details for ${productUrl}:`, error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Parse categories from HTML content
   */
  private parseCategoriesFromHtml(html: string): AllegroCategory[] {
    const categories: AllegroCategory[] = [];
    
    try {
      // Multiple patterns to match different category link formats on Allegro
      const patterns = [
        // Main category links in navigation
        /<a[^>]*href="([^"]*kategoria[^"]*)"[^>]*>([^<]+)<\/a>/gi,
        // Category links with data attributes
        /<a[^>]*data-category[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi,
        // Link elements with category in href
        /<a[^>]*href="([^"]*\/kategoria\/[^"]*)"[^>]*>([^<]+)<\/a>/gi,
        // Alternative patterns for category pages
        /<a[^>]*href="([^"]*allegro\.pl\/kategoria[^"]*)"[^>]*>([^<]+)<\/a>/gi
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const url = match[1];
          const name = match[2].trim();
          
          // Skip empty names or very short names
          if (!name || name.length < 2) continue;
          
          // Skip if URL is relative, make it absolute
          const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
          
          // Extract category ID from URL
          const idMatch = url.match(/\/kategoria\/([^\/\?]+)/);
          const id = idMatch ? idMatch[1] : this.generateIdFromName(name);
          const cleanName = this.cleanText(name);
          const englishName = CategoryTranslationService.getBestEnglishName(cleanName, fullUrl);
          
          categories.push({
            id,
            name: cleanName,
            nameEn: englishName,
            url: fullUrl,
            level: 0, // Main categories are level 0
            hasProducts: false
          });
        }
      });
      
      // If no categories found with patterns, try to extract any links that might be categories
      if (categories.length === 0) {
        this.logger.warn('No categories found with standard patterns, trying fallback...');
        
        // Look for common Polish category words in links
        const fallbackPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]*(?:motoryzacja|dom|ogród|moda|elektronika|sport|dziecko|ksiązki|muzyka|gry|zdrowie|uroda)[^<]*)<\/a>/gi;
        let match;
        
        while ((match = fallbackPattern.exec(html)) !== null) {
          const url = match[1];
          const name = match[2].trim();
          
          if (!name || name.length < 3) continue;
          
          const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
          const id = this.generateIdFromName(name);
          const cleanName = this.cleanText(name);
          const englishName = CategoryTranslationService.getBestEnglishName(cleanName, fullUrl);
          
          categories.push({
            id,
            name: cleanName,
            nameEn: englishName,
            url: fullUrl,
            level: 0, // Fallback categories are also level 0
            hasProducts: false
          });
        }
      }
      
      // Remove duplicates based on ID
      const uniqueCategories = this.removeDuplicateCategories(categories);
      
      this.logger.log(`Parsed ${uniqueCategories.length} unique categories from HTML`);
      
      return uniqueCategories;
    } catch (error) {
      this.logger.error('Error parsing categories from HTML:', error.message);
      return [];
    }
  }

  /**
   * Parse subcategories from HTML content
   */
  private parseSubcategoriesFromHtml(html: string, parentUrl: string): AllegroCategory[] {
    const subcategories: AllegroCategory[] = [];
    
    try {
      // Pattern to match subcategory links within the category page
      const subcategoryPattern = /<a[^>]*href="([^"]*)"[^>]*class="[^"]*category[^"]*"[^>]*>([^<]+)<\/a>/gi;
      let match;
      
      while ((match = subcategoryPattern.exec(html)) !== null) {
        const url = match[1];
        const name = match[2].trim();
        
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
        const idMatch = url.match(/\/([^\/\?]+)$/);
        const id = idMatch ? idMatch[1] : this.generateIdFromName(name);
        const cleanName = this.cleanText(name);
        const englishName = CategoryTranslationService.getBestEnglishName(cleanName, fullUrl);
        
        // Determine the level based on URL depth and parent context
        const level = this.determineCategoryLevel(fullUrl, parentUrl);
        
        subcategories.push({
          id,
          name: cleanName,
          nameEn: englishName,
          url: fullUrl,
          parentId: this.extractCategoryIdFromUrl(parentUrl),
          level,
          hasProducts: false
        });
      }
      
      return this.removeDuplicateCategories(subcategories);
    } catch (error) {
      this.logger.error('Error parsing subcategories from HTML:', error.message);
      return [];
    }
  }

  /**
   * Parse products from HTML content
   */
  private parseProductsFromHtml(html: string, categoryUrl?: string): AllegroProduct[] {
    const products: AllegroProduct[] = [];
    
    try {
      // Pattern to match product containers (simplified)
      const productPattern = /<article[^>]*data-testid="listing-item"[^>]*>(.*?)<\/article>/gis;
      let match;
      
      while ((match = productPattern.exec(html)) !== null) {
        const productHtml = match[1];
        const product = this.parseIndividualProduct(productHtml, categoryUrl);
        
        if (product) {
          products.push(product);
        }
      }
      
      return products;
    } catch (error) {
      this.logger.error('Error parsing products from HTML:', error.message);
      return [];
    }
  }

  /**
   * Parse individual product from HTML
   */
  private parseIndividualProduct(productHtml: string, categoryUrl?: string): AllegroProduct | null {
    try {
      // Extract product URL
      const urlMatch = productHtml.match(/href="([^"]*\/oferta\/[^"]*)"/);
      if (!urlMatch) return null;
      
      const productUrl = urlMatch[1].startsWith('http') ? urlMatch[1] : `${this.baseUrl}${urlMatch[1]}`;
      
      // Extract product ID from URL
      const idMatch = productUrl.match(/\/oferta\/([^\/\?]+)/);
      const id = idMatch ? idMatch[1] : '';
      
      // Extract title
      const titleMatch = productHtml.match(/<h2[^>]*>([^<]+)<\/h2>/) || 
                       productHtml.match(/alt="([^"]+)"/);
      const title = titleMatch ? this.cleanText(titleMatch[1]) : '';
      
      // Extract price
      const priceMatch = productHtml.match(/(\d+(?:,\d+)?)\s*(zł)/);
      const price = priceMatch ? priceMatch[1] : '';
      const currency = priceMatch ? 'PLN' : '';
      
      // Extract image URL
      const imageMatch = productHtml.match(/src="([^"]*\.(jpg|jpeg|png|webp)[^"]*)"/i);
      const imageUrl = imageMatch ? imageMatch[1] : undefined;
      
      // Extract seller information
      const sellerMatch = productHtml.match(/seller[^>]*>([^<]+)</i);
      const sellerName = sellerMatch ? this.cleanText(sellerMatch[1]) : '';
      
      return {
        id,
        title,
        price,
        currency,
        imageUrl,
        url: productUrl,
        categoryId: categoryUrl ? this.extractCategoryIdFromUrl(categoryUrl) : '',
        seller: {
          name: sellerName
        }
      };
    } catch (error) {
      this.logger.error('Error parsing individual product:', error.message);
      return null;
    }
  }

  /**
   * Parse detailed product information from HTML
   */
  private parseProductDetailsFromHtml(html: string, productUrl: string): AllegroProduct {
    try {
      const basicProduct = this.parseIndividualProduct(html);
      
      if (!basicProduct) {
        // Create a minimal product object
        const idMatch = productUrl.match(/\/oferta\/([^\/\?]+)/);
        return {
          id: idMatch ? idMatch[1] : '',
          title: '',
          price: '',
          currency: 'PLN',
          url: productUrl,
          categoryId: '',
          seller: { name: '' }
        };
      }
      
      // Extract additional details
      const specifications: { [key: string]: string } = {};
      
      // Extract specifications table
      const specPattern = /<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/gi;
      let specMatch;
      
      while ((specMatch = specPattern.exec(html)) !== null) {
        const key = this.cleanText(specMatch[1]);
        const value = this.cleanText(specMatch[2]);
        specifications[key] = value;
      }
      
      // Extract condition
      const conditionMatch = html.match(/stan[^>]*>([^<]+)</i);
      const condition = conditionMatch ? this.cleanText(conditionMatch[1]) : undefined;
      
      // Extract location
      const locationMatch = html.match(/lokalizacja[^>]*>([^<]+)</i);
      const location = locationMatch ? this.cleanText(locationMatch[1]) : undefined;
      
      return {
        ...basicProduct,
        specifications,
        condition,
        location
      };
    } catch (error) {
      this.logger.error('Error parsing product details:', error.message);
      
      const idMatch = productUrl.match(/\/oferta\/([^\/\?]+)/);
      return {
        id: idMatch ? idMatch[1] : '',
        title: '',
        price: '',
        currency: 'PLN',
        url: productUrl,
        categoryId: '',
        seller: { name: '' }
      };
    }
  }

  /**
   * Utility methods
   */
  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private generateIdFromName(name: string): string {
    return name.toLowerCase()
               .replace(/[^\w\s-]/g, '')
               .replace(/\s+/g, '-')
               .substring(0, 50);
  }

  private extractCategoryIdFromUrl(url: string): string {
    const match = url.match(/\/kategoria\/([^\/\?]+)/);
    return match ? match[1] : '';
  }

  private removeDuplicateCategories(categories: AllegroCategory[]): AllegroCategory[] {
    const seen = new Set<string>();
    return categories.filter(category => {
      if (seen.has(category.id)) {
        return false;
      }
      seen.add(category.id);
      return true;
    });
  }

  /**
   * Health check for scraping service
   */
  /**
   * Determines the category level based on URL structure and context
   * Level 0: Main categories (kategoria/)
   * Level 1: Subcategories (first level under main category)
   * Level 2: Subcategory Level 1
   * Level 3: Subcategory Level 2  
   * Level 4: Subcategory Level 3
   */
  private determineCategoryLevel(url: string, parentUrl: string): number {
    try {
      // Count path segments after the base domain to determine depth
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
      
      // Main categories typically have pattern: /kategoria/[category-name]
      if (pathSegments.length <= 2 && pathSegments[0] === 'kategoria') {
        return 0; // Main category
      }
      
      // For subcategories, determine level based on depth
      // This is a simplified approach - you may need to adjust based on Allegro's actual URL structure
      if (pathSegments.length === 3) return 1; // First subcategory level
      if (pathSegments.length === 4) return 2; // Second subcategory level  
      if (pathSegments.length === 5) return 3; // Third subcategory level
      if (pathSegments.length >= 6) return 4; // Fourth subcategory level (max)
      
      // Fallback: if we can't determine from URL, assume it's a subcategory
      return 1;
    } catch (error) {
      this.logger.warn(`Could not determine category level for URL: ${url}`, error.message);
      return 1; // Default to subcategory level
    }
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      // Test with a simple request to Allegro homepage
      const response = await this.makeProxiedRequest(`${this.baseUrl}/`);
      
      if (response.status === 200) {
        return {
          status: 'healthy',
          message: 'Scraping service is working properly'
        };
      } else {
        return {
          status: 'unhealthy',
          message: `Received status code: ${response.status}`
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Scraping service error: ${error.message}`
      };
    }
  }
}
