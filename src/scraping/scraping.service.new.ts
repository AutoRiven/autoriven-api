import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { Category, ScrapingConfig, ScrapingResult } from './interfaces/scraping.interface';
import { ScrapingHttpClient } from './utils/http-client.util';
import { translateCategory, createSlug } from './utils/translations.util';
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
    
    const startTime = new Date();
    const scrapedCategories = new Map<string, Category>();
    
    try {
      await this.scrapeAutomotiveCategories(scrapedCategories);
      
      const categories = Array.from(scrapedCategories.values());
      const result: ScrapingResult = {
        scrapedAt: startTime.toISOString(),
        totalCategories: categories.length,
        method: 'Pure scraping from Allegro with scrape.do proxy - NO HARDCODED DATA',
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
   * Scrape automotive categories with deep hierarchy - NO HARDCODED DATA
   */
  private async scrapeAutomotiveCategories(categoriesMap: Map<string, Category>): Promise<void> {
    this.logger.log('🎯 Scraping automotive categories from Allegro (pure scraping mode)...');
    
    const carPartsUrl = `${this.config.baseUrl}/kategoria/czesci-samochodowe-620`;
    
    try {
      this.logger.log(`📡 Fetching main automotive page: ${carPartsUrl}`);
      const response = await this.httpClient.get(carPartsUrl);
      
      // Add root category
      const rootCategory: Category = {
        id: '620',
        name: 'Części samochodowe',
        nameEn: 'Car Parts',
        slug: 'czesci-samochodowe',
        url: carPartsUrl,
        level: 1,
        parentId: null,
        allegroId: '620',
        hasProducts: true,
        productCount: this.extractProductCount(response.data)
      };
      
      categoriesMap.set(rootCategory.allegroId, rootCategory);
      
      // Extract subcategories from the scraped page
      const level2Categories = this.extractCategoriesFromPage(response.data, 2, '620');
      this.logger.log(`📋 Found ${level2Categories.length} level 2 categories from scraping`);
      
      if (level2Categories.length === 0) {
        this.logger.warn('No subcategories found, attempting to scrape with different selectors...');
        await this.debugPageStructure(response.data);
        throw new Error('No subcategories found in scraped page - page structure may have changed');
      }
      
      // Add each level 2 category and scrape deeper
      for (const category of level2Categories) {
        categoriesMap.set(category.allegroId, category);
        
        // Scrape deeper levels recursively
        await this.scrapeSubcategoriesRecursively(category, categoriesMap, 3, 6);
        
        // Delay between requests
        await this.sleep(this.config.requestDelay);
      }
      
      this.logger.log(`✅ Successfully scraped ${categoriesMap.size} total categories`);
      
    } catch (error) {
      this.logger.error('❌ Pure scraping failed - no fallback data available:', error.message);
      throw new Error(`Scraping failed: ${error.message}. Please check Allegro page structure or proxy configuration.`);
    }
  }

  /**
   * Recursively scrape subcategories to specified depth
   */
  private async scrapeSubcategoriesRecursively(
    parentCategory: Category,
    categoriesMap: Map<string, Category>,
    level: number,
    maxLevel: number = 6
  ): Promise<void> {
    if (level > maxLevel) {
      this.logger.debug(`Reached maximum depth (${maxLevel}) for category: ${parentCategory.name}`);
      return;
    }
    
    try {
      this.logger.debug(`🔍 Scraping level ${level} subcategories for: ${parentCategory.name}`);
      
      const response = await this.httpClient.get(parentCategory.url);
      const subcategories = this.extractCategoriesFromPage(response.data, level, parentCategory.allegroId);
      
      this.logger.debug(`Found ${subcategories.length} subcategories at level ${level} for ${parentCategory.name}`);
      
      for (const subcategory of subcategories) {
        if (!categoriesMap.has(subcategory.allegroId)) {
          categoriesMap.set(subcategory.allegroId, subcategory);
          
          // Continue recursively if not at max level
          if (level < maxLevel) {
            await this.scrapeSubcategoriesRecursively(subcategory, categoriesMap, level + 1, maxLevel);
          }
          
          // Small delay between subcategory requests
          await this.sleep(500);
        }
      }
      
    } catch (error) {
      this.logger.warn(`Failed to scrape subcategories for ${parentCategory.name} at level ${level}:`, error.message);
    }
  }

  /**
   * Extract categories from HTML page using multiple selector strategies
   */
  private extractCategoriesFromPage(html: string, level: number, parentId: string | null): Category[] {
    const $ = cheerio.load(html);
    const categories: Category[] = [];
    
    // Multiple selector strategies for Allegro category links
    const selectors = [
      'a[href*="/kategoria/"]',
      '.category-link',
      '.subcategory-link',
      'a[data-category-id]',
      '.category-tile a',
      '.category-item a',
      '[class*="category"] a[href*="/kategoria/"]',
      'a[href*="czesci-samochodowe"]'
    ];
    
    const foundLinks = new Set<string>();
    
    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const text = $link.text().trim();
        
        if (href && text && href.includes('/kategoria/') && !foundLinks.has(href)) {
          foundLinks.add(href);
          
          // Extract category ID from URL
          const idMatch = href.match(/\/kategoria\/[^-]+-(\d+)/);
          if (idMatch && idMatch[1]) {
            const allegroId = idMatch[1];
            const categoryName = this.cleanCategoryName(text);
            
            if (categoryName && categoryName.length > 2) {
              const category: Category = {
                id: allegroId,
                name: categoryName,
                nameEn: translateCategory(categoryName),
                slug: createSlug(categoryName),
                url: href.startsWith('http') ? href : `${this.config.baseUrl}${href}`,
                level,
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
    }
    
    // Remove duplicates by allegroId
    const uniqueCategories = categories.filter((category, index, self) => 
      index === self.findIndex(c => c.allegroId === category.allegroId)
    );
    
    this.logger.debug(`Extracted ${uniqueCategories.length} unique categories at level ${level}`);
    return uniqueCategories;
  }

  /**
   * Extract product count from page content
   */
  private extractProductCount(html: string): number {
    const $ = cheerio.load(html);
    
    // Multiple selectors for product count
    const countSelectors = [
      '.category-counter',
      '.results-count',
      '.product-count',
      '[data-count]',
      'span:contains("wyników")',
      'span:contains("oferuje")'
    ];
    
    for (const selector of countSelectors) {
      const countText = $(selector).text();
      const countMatch = countText.match(/(\d+[\s\d]*)/);
      if (countMatch) {
        const count = parseInt(countMatch[1].replace(/\s/g, ''), 10);
        if (!isNaN(count)) {
          return count;
        }
      }
    }
    
    return 0;
  }

  /**
   * Extract product count from link element
   */
  private extractProductCountFromLink($link: cheerio.Cheerio): number {
    const dataCount = $link.attr('data-count');
    if (dataCount) {
      const count = parseInt(dataCount, 10);
      if (!isNaN(count)) return count;
    }
    
    const countText = $link.find('.count, .counter, .results').text();
    if (countText) {
      const countMatch = countText.match(/(\d+)/);
      if (countMatch) {
        const count = parseInt(countMatch[1], 10);
        if (!isNaN(count)) return count;
      }
    }
    
    return 0;
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
   * Debug page structure for troubleshooting
   */
  private async debugPageStructure(html: string): Promise<void> {
    const $ = cheerio.load(html);
    
    this.logger.debug('🔍 Debugging page structure...');
    this.logger.debug(`Page title: ${$('title').text()}`);
    this.logger.debug(`Total links: ${$('a').length}`);
    this.logger.debug(`Category links found: ${$('a[href*="/kategoria/"]').length}`);
    
    // Log some sample links
    $('a[href*="/kategoria/"]').slice(0, 5).each((_, element) => {
      const $link = $(element);
      this.logger.debug(`Sample link: ${$link.attr('href')} - ${$link.text().trim()}`);
    });
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
