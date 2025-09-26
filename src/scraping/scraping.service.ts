import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { Category, ScrapingConfig, ScrapingResult } from './interfaces/scraping.interface';
import { ScrapingHttpClient } from '../utils/http-client.util';
import { translateCategory, createSlug } from '../common/translations.util';
import * as cheerio from 'cheerio';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  private readonly config: ScrapingConfig;
  private readonly httpClient: ScrapingHttpClient;

  constructor(private configService: ConfigService) {
    this.config = {
      baseUrl: this.configService.get<string>('ALLEGRO_BASE_URL', 'https://allegro.pl'),
      proxyToken: this.configService.get<string>('SCRAPE_DO_TOKEN'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      maxRetries: 3,
      requestDelay: 2000,
    };

    if (!this.config.proxyToken) {
      throw new Error('SCRAPE_DO_TOKEN environment variable is required');
    }

    this.httpClient = new ScrapingHttpClient(this.config);
  }

  /**
   * Main method to scrape automotive categories from Allegro - PURE SCRAPING ONLY
   */
  async scrapeAllCategories(): Promise<ScrapingResult> {
    this.logger.log('🚗 Starting pure automotive category scraping from Allegro...');
    
    // First test proxy connectivity
    await this.testProxyConnection();
    
    const startTime = new Date();
    const scrapedCategories = new Map<string, Category>();
    
    try {
      // Start scraping from the base automotive parts category
      const baseUrl = 'https://allegro.pl/kategoria/czesci-samochodowe-620';
      await this.scrapeFromBaseCategory(baseUrl, scrapedCategories);
      
      const categories = Array.from(scrapedCategories.values());
      const result: ScrapingResult = {
        scrapedAt: startTime.toISOString(),
        totalCategories: categories.length,
        method: 'Pure dynamic scraping from Allegro with scrape.do proxy - NO HARDCODED DATA',
        levelBreakdown: this.calculateLevelBreakdown(categories),
        categories,
      };

      this.saveResults(result);
      
      this.logger.log(`✅ Pure scraping completed. Found ${categories.length} categories.`);
      return result;
      
    } catch (error) {
      this.logger.error('❌ Pure scraping failed:', error);
      throw error;
    }
  }

  /**
   * Test proxy connection with a simple request
   */
  private async testProxyConnection(): Promise<void> {
    this.logger.log('🔍 Testing proxy connection...');
    
    try {
      const testUrl = 'https://httpbin.org/get';
      const response = await this.httpClient.get(testUrl, { timeout: 10000 });
      
      if (response.status === 200) {
        this.logger.log('✅ Proxy connection test successful');
        this.logger.debug(`Response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      this.logger.error('❌ Proxy connection test failed:', error.message);
      throw new Error(`Proxy test failed: ${error.message}. Check your SCRAPE_DO_TOKEN and proxy configuration.`);
    }
  }

  /**
   * Scrape categories starting from the base automotive parts URL
   */
  private async scrapeFromBaseCategory(baseUrl: string, categoriesMap: Map<string, Category>): Promise<void> {
    this.logger.log(`🎯 Starting dynamic scraping from base URL: ${baseUrl}`);
    
    try {
      // Scrape the base category page
      const response = await this.httpClient.get(baseUrl);
      
      // Extract base category info from URL
      const baseIdMatch = baseUrl.match(/\/kategoria\/.*-(\d+)/);
      if (!baseIdMatch || !baseIdMatch[1]) {
        throw new Error('Could not extract category ID from base URL');
      }
      
      const baseId = baseIdMatch[1];
      const baseSlugMatch = baseUrl.match(/\/kategoria\/([^-]+)/);
      const baseSlug = baseSlugMatch ? baseSlugMatch[1] : 'czesci-samochodowe';
      
      // Extract the category name from page content
      const $ = cheerio.load(response.data);
      let categoryName = 'Części samochodowe';
      
      // Try different selectors to get the page title/category name
      const titleSelectors = [
        'h1',
        '.category-title',
        '.page-title', 
        '[data-role="category-title"]',
        'title'
      ];
      
      for (const selector of titleSelectors) {
        const titleElement = $(selector).first();
        if (titleElement.length > 0) {
          const titleText = titleElement.text().trim();
          if (titleText && titleText.length > 0 && !titleText.toLowerCase().includes('allegro')) {
            categoryName = this.cleanCategoryName(titleText);
            break;
          }
        }
      }
      
      // Create the base category
      const baseCategory: Category = {
        id: baseId,
        name: categoryName,
        nameEn: translateCategory(categoryName),
        slug: baseSlug,
        url: baseUrl,
        level: 1,
        parentId: null,
        allegroId: baseId,
        hasProducts: true,
        productCount: this.extractProductCount(response.data)
      };
      
      categoriesMap.set(baseCategory.allegroId, baseCategory);
      this.logger.log(`✅ Added base category: ${baseCategory.name} (ID: ${baseCategory.allegroId})`);
      
      // Extract level 2 categories (main subcategories like "części karoserii", "oświetlenie", etc.)
      const level2Categories = this.extractMainSubcategories(response.data, baseCategory.allegroId);
      this.logger.log(`📋 Found ${level2Categories.length} level 2 main subcategories`);
      
      // First, add ALL level 2 categories to the map without processing their subcategories
      this.logger.log(`📥 Adding all ${level2Categories.length} level 2 categories to map first...`);
      for (const level2Category of level2Categories) {
        if (!categoriesMap.has(level2Category.allegroId)) {
          categoriesMap.set(level2Category.allegroId, level2Category);
          this.logger.log(`✅ Added level 2 category: ${level2Category.name} (ID: ${level2Category.allegroId})`);
        } else {
          this.logger.debug(`⏭️  Skipping duplicate level 2 category: ${level2Category.name} (ID: ${level2Category.allegroId})`);
        }
      }
      
      // Then process their subcategories
      this.logger.log(`🔄 Now processing subcategories for all level 2 categories...`);
      for (let i = 0; i < level2Categories.length; i++) {
        const level2Category = level2Categories[i];
        this.logger.log(`🔄 Processing subcategories for level 2 category ${i + 1}/${level2Categories.length}: ${level2Category.name}`);
        
        try {
          // Scrape level 3 categories (specific part categories like "błotniki", "dachy", etc.)
          await this.scrapeLevel3Categories(level2Category, categoriesMap);
          await this.sleep(this.config.requestDelay);
          this.logger.debug(`✅ Completed processing level 3 for: ${level2Category.name}`);
        } catch (subError) {
          this.logger.warn(`❌ Failed to scrape level 3 for ${level2Category.name}:`, subError.message);
          this.logger.warn(`❌ Error details:`, subError.stack);
          // Continue with next category instead of breaking
        }
      }
      
      this.logger.log(`✅ Completed scraping from base category. Total categories: ${categoriesMap.size}`);
      
    } catch (error) {
      this.logger.error(`❌ Failed to scrape from base category ${baseUrl}:`, error.message);
      throw error;
    }
  }

  /**
   * Extract main subcategories (level 2) - focusing on main automotive parts categories
   */
  private extractMainSubcategories(html: string, parentId: string): Category[] {
    const $ = cheerio.load(html);
    const categories: Category[] = [];
    
    // Use the exact selectors from the live Allegro HTML structure
    const selectors = [
      // Primary selector for the subcategories list
      'ul#links-list-Categories li[data-role="LinkItem"] a[data-role="LinkItemAnchor"]',
      // Fallback selectors for categories section
      'div[data-role="Categories"] a[href*="/kategoria/czesci-samochodowe-"]',
      'section a[href*="/kategoria/czesci-samochodowe-"]',
      // Generic fallback
      'a[href*="/kategoria/czesci-samochodowe-"]'
    ];
    
    const foundLinks = new Set<string>();
    
    // Expected main automotive subcategories from the live HTML
    const expectedCategories = [
      'Części karoserii', 'Filtry', 'Oświetlenie', 'Silniki i osprzęt',
      'Układ chłodzenia silnika', 'Układ elektryczny, zapłon', 'Układ hamulcowy',
      'Układ kierowniczy', 'Układ klimatyzacji', 'Układ napędowy',
      'Układ paliwowy', 'Układ pneumatyczny', 'Układ wentylacji',
      'Układ wydechowy', 'Układ zawieszenia', 'Wycieraczki i spryskiwacze',
      'Wyposażenie wnętrza', 'Ogrzewanie postojowe i chłodnictwo samochodowe',
      'Tuning mechaniczny', 'Wyposażenie i chemia OE', 'Pozostałe'
    ];
    
    for (const selector of selectors) {
      try {
        $(selector).each((_, element) => {
          const $link = $(element);
          const href = $link.attr('href');
          const text = $link.text().trim();
          
          if (href && text && href.includes('/kategoria/czesci-samochodowe-') && !foundLinks.has(href)) {
            foundLinks.add(href);
            
            // Extract category ID from URL using the pattern from live HTML
            const idMatch = href.match(/\/kategoria\/czesci-samochodowe-.*?-(\d+)$/);
            if (idMatch && idMatch[1]) {
              const allegroId = idMatch[1];
              const categoryName = this.cleanCategoryName(text);
              
              // Check if this is one of the expected main subcategories
              const isExpectedCategory = allegroId !== parentId && 
                categoryName.length > 3 && 
                (expectedCategories.some(expected => 
                  categoryName.toLowerCase().includes(expected.toLowerCase()) ||
                  expected.toLowerCase().includes(categoryName.toLowerCase())
                ) || href.includes('czesci-samochodowe-'));
              
              if (isExpectedCategory) {
                const category: Category = {
                  id: allegroId,
                  name: categoryName,
                  nameEn: translateCategory(categoryName),
                  slug: createSlug(categoryName),
                  url: href.startsWith('http') ? href : `${this.config.baseUrl}${href}`,
                  level: 2,
                  parentId,
                  allegroId,
                  hasProducts: true,
                  productCount: this.extractProductCountFromLink($link)
                };
                
                categories.push(category);
                this.logger.debug(`✅ Found level 2 category: ${categoryName} (${allegroId})`);
              }
            }
          }
        });
      } catch (error) {
        this.logger.debug(`Error with selector ${selector}:`, error.message);
      }
    }
    
    // If we didn't find enough categories with the structured approach, try data attributes approach
    if (categories.length < 15) {
      this.logger.warn(`Only found ${categories.length} level 2 categories, trying data attributes approach...`);
      
      try {
        $('a[data-custom-params]').each((_, element) => {
          const $link = $(element);
          const href = $link.attr('href');
          const customParams = $link.attr('data-custom-params');
          
          if (href && customParams && href.includes('/kategoria/czesci-samochodowe-') && !foundLinks.has(href)) {
            foundLinks.add(href);
            
            try {
              const params = JSON.parse(customParams);
              if (params.id && params.name) {
                const allegroId = params.id.toString();
                const categoryName = this.cleanCategoryName(params.name);
                
                if (allegroId !== parentId && categoryName.length > 3) {
                  const category: Category = {
                    id: allegroId,
                    name: categoryName,
                    nameEn: translateCategory(categoryName),
                    slug: createSlug(categoryName),
                    url: href.startsWith('http') ? href : `${this.config.baseUrl}${href}`,
                    level: 2,
                    parentId,
                    allegroId,
                    hasProducts: true,
                    productCount: params.count || 0
                  };
                  
                  categories.push(category);
                  this.logger.debug(`✅ Found level 2 category via data attributes: ${categoryName} (${allegroId})`);
                }
              }
            } catch (parseError) {
              // Skip invalid JSON
            }
          }
        });
      } catch (error) {
        this.logger.debug(`Error with data attributes approach:`, error.message);
      }
    }
    
    // Remove duplicates and sort
    const uniqueCategories = categories
      .filter((category, index, self) => 
        index === self.findIndex(c => c.allegroId === category.allegroId)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
    
    this.logger.log(`📋 Extracted ${uniqueCategories.length} main subcategories (level 2). Expected ~22.`);
    
    if (uniqueCategories.length < 15) {
      this.logger.warn(`⚠️  Only found ${uniqueCategories.length} level 2 categories. Expected ~22. May need selector adjustment.`);
    }
    
    return uniqueCategories;
  }

  /**
   * Scrape level 3 categories (specific part categories like "błotniki", "dachy", etc.)
   */
  private async scrapeLevel3Categories(level2Category: Category, categoriesMap: Map<string, Category>): Promise<void> {
    this.logger.debug(`🔍 Scraping level 3 categories for: ${level2Category.name}`);
    
    try {
      const response = await this.httpClient.get(level2Category.url);
      const level3Categories = this.extractSpecificPartCategories(response.data, level2Category.allegroId);
      
      this.logger.debug(`Found ${level3Categories.length} level 3 categories for ${level2Category.name}`);
      
      for (const level3Category of level3Categories) {
        if (!categoriesMap.has(level3Category.allegroId)) {
          categoriesMap.set(level3Category.allegroId, level3Category);
          this.logger.debug(`✅ Added level 3 category: ${level3Category.name} (ID: ${level3Category.allegroId})`);
          
          // Scrape level 4 categories (final specific parts)
          try {
            await this.scrapeLevel4Categories(level3Category, categoriesMap);
            await this.sleep(500); // Shorter delay for level 4
          } catch (level4Error) {
            this.logger.debug(`Failed to scrape level 4 for ${level3Category.name}:`, level4Error.message);
          }
        }
      }
      
    } catch (error) {
      this.logger.warn(`Failed to scrape level 3 categories for ${level2Category.name}:`, error.message);
    }
  }

  /**
   * Extract specific part categories (level 3) like "błotniki", "dachy", "drzwi", etc.
   */
  private extractSpecificPartCategories(html: string, parentId: string): Category[] {
    const $ = cheerio.load(html);
    const categories: Category[] = [];
    
    // Selectors for specific part categories
    const selectors = [
      'a[href*="/kategoria/czesci-karoserii-"]',
      'a[href*="/kategoria/lampy-"]',
      'a[href*="/kategoria/czujniki-"]',
      'a[href*="/kategoria/blok-silnika-"]',
      'a[href*="/kategoria/elementy-napedu-"]',
      'a[href*="/kategoria/glowice-"]',
      'a[href*="/kategoria/chlodnice-"]',
      'a[href*="/kategoria/centralne-zamki-"]',
      'a[href*="/kategoria/hamulce-"]',
      'a[href*="/kategoria/kompresory-"]',
      'a[href*="/kategoria/uklad-"]',
      'a[href*="/kategoria/"]'
    ];
    
    const foundLinks = new Set<string>();
    
    for (const selector of selectors) {
      try {
        $(selector).each((_, element) => {
          const $link = $(element);
          const href = $link.attr('href');
          const text = $link.text().trim();
          
          if (href && text && href.includes('/kategoria/') && !foundLinks.has(href)) {
            foundLinks.add(href);
            
            const idMatch = href.match(/\/kategoria\/.*-(\d+)/);
            if (idMatch && idMatch[1]) {
              const allegroId = idMatch[1];
              const categoryName = this.cleanCategoryName(text);
              
              if (categoryName && categoryName.length > 3 && allegroId !== parentId) {
                const category: Category = {
                  id: allegroId,
                  name: categoryName,
                  nameEn: translateCategory(categoryName),
                  slug: createSlug(categoryName),
                  url: href.startsWith('http') ? href : `${this.config.baseUrl}${href}`,
                  level: 3,
                  parentId,
                  allegroId,
                  hasProducts: true,
                  productCount: this.extractProductCountFromLink($link)
                };
                
                categories.push(category);
              }
            }
          }
        });
      } catch (error) {
        this.logger.debug(`Error with selector ${selector}:`, error.message);
      }
    }
    
    const uniqueCategories = categories.filter((category, index, self) => 
      index === self.findIndex(c => c.allegroId === category.allegroId)
    );
    
    return uniqueCategories;
  }

  /**
   * Scrape level 4 categories (final specific parts like "błotniki-błotniki", "błotniki-uszczelki", etc.)
   */
  private async scrapeLevel4Categories(level3Category: Category, categoriesMap: Map<string, Category>): Promise<void> {
    this.logger.debug(`🔍 Scraping level 4 categories for: ${level3Category.name}`);
    
    try {
      const response = await this.httpClient.get(level3Category.url);
      const level4Categories = this.extractFinalPartCategories(response.data, level3Category.allegroId);
      
      this.logger.debug(`Found ${level4Categories.length} level 4 categories for ${level3Category.name}`);
      
      for (const level4Category of level4Categories) {
        if (!categoriesMap.has(level4Category.allegroId)) {
          categoriesMap.set(level4Category.allegroId, level4Category);
          this.logger.debug(`✅ Added level 4 category: ${level4Category.name} (ID: ${level4Category.allegroId})`);
        }
      }
      
    } catch (error) {
      this.logger.debug(`Failed to scrape level 4 categories for ${level3Category.name}:`, error.message);
    }
  }

  /**
   * Extract final part categories (level 4) - the most specific categories
   */
  private extractFinalPartCategories(html: string, parentId: string): Category[] {
    const $ = cheerio.load(html);
    const categories: Category[] = [];
    
    const selectors = ['a[href*="/kategoria/"]'];
    const foundLinks = new Set<string>();
    
    for (const selector of selectors) {
      try {
        $(selector).each((_, element) => {
          const $link = $(element);
          const href = $link.attr('href');
          const text = $link.text().trim();
          
          if (href && text && href.includes('/kategoria/') && !foundLinks.has(href)) {
            foundLinks.add(href);
            
            const idMatch = href.match(/\/kategoria\/.*-(\d+)/);
            if (idMatch && idMatch[1]) {
              const allegroId = idMatch[1];
              const categoryName = this.cleanCategoryName(text);
              
              if (categoryName && categoryName.length > 3 && allegroId !== parentId) {
                const category: Category = {
                  id: allegroId,
                  name: categoryName,
                  nameEn: translateCategory(categoryName),
                  slug: createSlug(categoryName),
                  url: href.startsWith('http') ? href : `${this.config.baseUrl}${href}`,
                  level: 4,
                  parentId,
                  allegroId,
                  hasProducts: true,
                  productCount: this.extractProductCountFromLink($link)
                };
                
                categories.push(category);
              }
            }
          }
        });
      } catch (error) {
        this.logger.debug(`Error with selector ${selector}:`, error.message);
      }
    }
    
    const uniqueCategories = categories.filter((category, index, self) => 
      index === self.findIndex(c => c.allegroId === category.allegroId)
    );
    
    return uniqueCategories;
  }

  /**
   * Extract product count from page content
   */
  private extractProductCount(html: string): number {
    const $ = cheerio.load(html);
    
    // Multiple selectors for product count
    const countSelectors = [
      '[data-testid="results-count"]',
      '[data-role="results-counter"]',
      '.results-count',
      '.category-counter',
      '.product-count',
      '[data-count]',
      'span:contains("wyników")',
      'span:contains("oferuje")',
      'span:contains("results")',
      'span:contains("products")'
    ];
    
    for (const selector of countSelectors) {
      try {
        const countText = $(selector).text();
        const countMatch = countText.match(/(\d+[\s\d]*)/);
        if (countMatch) {
          const count = parseInt(countMatch[1].replace(/\s/g, ''), 10);
          if (!isNaN(count)) {
            return count;
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    return 0;
  }

  /**
   * Extract product count from a link element
   */
  private extractProductCountFromLink($link: cheerio.Cheerio): number {
    try {
      // Try to find product count in various formats
      const text = $link.text();
      const countMatch = text.match(/\((\d+)\)/);
      if (countMatch) {
        return parseInt(countMatch[1], 10);
      }
      
      // Check for data attributes
      const dataCount = $link.attr('data-count') || $link.attr('data-product-count');
      if (dataCount) {
        return parseInt(dataCount, 10);
      }
      
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clean category name
   */
  private cleanCategoryName(name: string): string {
    return name
      .replace(/\s+/g, ' ')
      .replace(/[^\w\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]/g, '')
      .trim();
  }

  /**
   * Calculate level breakdown for result
   */
  private calculateLevelBreakdown(categories: Category[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const category of categories) {
      const level = category.level.toString();
      breakdown[level] = (breakdown[level] || 0) + 1;
    }
    
    return breakdown;
  }

  /**
   * Save results to JSON file
   */
  private saveResults(result: ScrapingResult): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `allegro-categories-${timestamp}.json`;
    const filepath = join(process.cwd(), 'results', filename);
    
    try {
      writeFileSync(filepath, JSON.stringify(result, null, 2));
      this.logger.log(`📁 Results saved to: ${filepath}`);
    } catch (error) {
      this.logger.error('Failed to save results:', error);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}