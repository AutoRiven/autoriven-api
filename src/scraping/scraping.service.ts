import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { Category, ScrapingConfig, ScrapingResult } from './interfaces/scraping.interface';
import { ScrapingHttpClient } from '../utils/http-client.util';
import { translateCategory, createSlug, createEnglishSlug, createAutoRivenUrl } from '../common/translations.util';
import { PREDEFINED_CATEGORY_URLS, getCategoryHierarchyFromUrl } from './predefined-categories';
import { Category as CategoryEntity } from '../products/entities/category.entity';
import { Subcategory as SubcategoryEntity } from '../products/entities/subcategory.entity';
import * as cheerio from 'cheerio';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  private readonly config: ScrapingConfig;
  private readonly httpClient: ScrapingHttpClient;
  private autoRivenIdCounter = 1000; // Starting AutoRiven ID

  /**
   * Get next AutoRiven ID and increment counter
   */
  private getNextAutoRivenId(): number {
    return this.autoRivenIdCounter++;
  }

  constructor(
    private configService: ConfigService,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(SubcategoryEntity)
    private subcategoryRepository: Repository<SubcategoryEntity>,
  ) {
    const proxyTokensEnv = this.configService.get<string>('SCRAPE_DO_TOKENS');
    const primaryProxyToken = this.configService.get<string>('SCRAPE_DO_TOKEN');
    const proxyTokens = proxyTokensEnv
      ?.split(',')
      .map(token => token.trim())
      .filter(token => token.length > 0);

    const requestDelay = Number(this.configService.get<string>('SCRAPE_REQUEST_DELAY', '2000')) || 2000;
    const requestDelayJitter = Number(this.configService.get<string>('SCRAPE_REQUEST_DELAY_JITTER', '1000')) || 1000;
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
   * Main method to scrape automotive categories from Allegro - ENHANCED WITH PREDEFINED CATEGORIES
   */
  async scrapeAllCategories(): Promise<ScrapingResult> {
    this.logger.log('🚗 Starting enhanced automotive category scraping from Allegro...');
    this.logger.log(`📋 Using ${PREDEFINED_CATEGORY_URLS.length} predefined category URLs for comprehensive coverage`);
    
    // Reset AutoRiven ID counter for each scrape
    this.autoRivenIdCounter = 1000;
    this.logger.log(`🔢 AutoRiven ID counter reset to ${this.autoRivenIdCounter}`);
    
    // First test proxy connectivity
    await this.testProxyConnection();
    
    const startTime = new Date();
    const scrapedCategories = new Map<string, Category>();
    
    try {
      // Start with dynamic scraping from the base category (without filters for initial scraping)
      const baseUrl = 'https://allegro.pl/kategoria/czesci-samochodowe-620';
      await this.scrapeFromBaseCategory(baseUrl, scrapedCategories);
      
      // Now scrape all predefined categories to ensure comprehensive coverage
      await this.scrapePredefinedCategories(scrapedCategories);
      
      const categories = Array.from(scrapedCategories.values());
      const result: ScrapingResult = {
        scrapedAt: startTime.toISOString(),
        totalCategories: categories.length,
        method: 'Enhanced scraping: Dynamic discovery + Predefined categories with scrape.do proxy + AutoRiven ID assignment (1000+) + English translations',
        levelBreakdown: this.calculateLevelBreakdown(categories),
        categories,
      };

      this.saveResults(result);
      
      // Log comprehensive statistics
      const autoRivenIds = categories.map(cat => cat.autoRivenId).sort((a, b) => a - b);
      const minAutoRivenId = Math.min(...autoRivenIds);
      const maxAutoRivenId = Math.max(...autoRivenIds);
      
      this.logger.log(`✅ Enhanced scraping completed. Found ${categories.length} categories.`);
      this.logger.log(`🔢 AutoRiven IDs assigned: ${minAutoRivenId} - ${maxAutoRivenId}`);
      this.logger.log(`📊 Level breakdown with AutoRiven IDs:`);
      
      [1, 2, 3, 4].forEach(level => {
        const levelCats = categories.filter(cat => cat.level === level);
        if (levelCats.length > 0) {
          const levelIds = levelCats.map(cat => cat.autoRivenId).sort((a, b) => a - b);
          const minId = Math.min(...levelIds);
          const maxId = Math.max(...levelIds);
          this.logger.log(`   Level ${level}: ${levelCats.length} categories (AutoRiven IDs ${minId}-${maxId})`);
        }
      });
      
      // Log predefined category coverage
      const predefinedCount = categories.filter(cat => cat.url && PREDEFINED_CATEGORY_URLS.includes(cat.url.split('?')[0])).length;
      this.logger.log(`📋 Predefined categories found: ${predefinedCount}/${PREDEFINED_CATEGORY_URLS.length}`);
      
      return result;
      
    } catch (error) {
      this.logger.error('❌ Enhanced scraping failed:', error);
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
      const englishName = translateCategory(categoryName);
      const autoRivenId = this.getNextAutoRivenId();
      const baseCategory: Category = {
        id: baseId,
        name: categoryName,
        nameEn: englishName,
        slug: baseSlug,
        englishSlug: createEnglishSlug(englishName),
        url: baseUrl,
        englishUrl: createAutoRivenUrl(createEnglishSlug(englishName), autoRivenId),
        autoRivenId,
        level: 1,
        parentId: null,
        allegroId: baseId,
        hasProducts: true,
        productCount: this.extractProductCount(response.data)
      };
      
      categoriesMap.set(baseCategory.allegroId, baseCategory);
      this.logger.log(`✅ Added base category: ${baseCategory.name} (Allegro ID: ${baseCategory.allegroId}, AutoRiven ID: ${baseCategory.autoRivenId})`);
      
      // Extract level 2 categories (main subcategories like "części karoserii", "oświetlenie", etc.)
      const level2Categories = this.extractMainSubcategories(response.data, baseCategory.allegroId);
      this.logger.log(`📋 Found ${level2Categories.length} level 2 main subcategories`);
      
      // First, add ALL level 2 categories to the map without processing their subcategories
      this.logger.log(`📥 Adding all ${level2Categories.length} level 2 categories to map first...`);
      for (const level2Category of level2Categories) {
        if (!categoriesMap.has(level2Category.allegroId)) {
          categoriesMap.set(level2Category.allegroId, level2Category);
          this.logger.log(`✅ Added level 2 category: ${level2Category.name} (Allegro ID: ${level2Category.allegroId}, AutoRiven ID: ${level2Category.autoRivenId})`);
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
                const englishName = translateCategory(categoryName);
                const autoRivenId = this.getNextAutoRivenId();
                const category: Category = {
                  id: allegroId,
                  name: categoryName,
                  nameEn: englishName,
                  slug: createSlug(categoryName),
                  englishSlug: createEnglishSlug(englishName),
                  url: href.startsWith('http') ? href : `${this.config.baseUrl}${href}`,
                  englishUrl: createAutoRivenUrl(createEnglishSlug(englishName), autoRivenId),
                  autoRivenId,
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
                  const englishName = translateCategory(categoryName);
                  const autoRivenId = this.getNextAutoRivenId();
                  const category: Category = {
                    id: allegroId,
                    name: categoryName,
                    nameEn: englishName,
                    slug: createSlug(categoryName),
                    englishSlug: createEnglishSlug(englishName),
                    url: href.startsWith('http') ? href : `${this.config.baseUrl}${href}`,
                    englishUrl: createAutoRivenUrl(createEnglishSlug(englishName), autoRivenId),
                    autoRivenId,
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
                const englishName = translateCategory(categoryName);
                const autoRivenId = this.getNextAutoRivenId();
                const category: Category = {
                  id: allegroId,
                  name: categoryName,
                  nameEn: englishName,
                  slug: createSlug(categoryName),
                  englishSlug: createEnglishSlug(englishName),
                  url: href.startsWith('http') ? href : `${this.config.baseUrl}${href}`,
                  englishUrl: createAutoRivenUrl(createEnglishSlug(englishName), autoRivenId),
                  autoRivenId,
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
                const englishName = translateCategory(categoryName);
                const autoRivenId = this.getNextAutoRivenId();
                const category: Category = {
                  id: allegroId,
                  name: categoryName,
                  nameEn: englishName,
                  slug: createSlug(categoryName),
                  englishSlug: createEnglishSlug(englishName),
                  url: href.startsWith('http') ? href : `${this.config.baseUrl}${href}`,
                  englishUrl: createAutoRivenUrl(createEnglishSlug(englishName), autoRivenId),
                  autoRivenId,
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
   * Scrape all predefined categories to ensure comprehensive coverage
   */
  private async scrapePredefinedCategories(categoriesMap: Map<string, Category>): Promise<void> {
    this.logger.log(`🎯 Scraping ${PREDEFINED_CATEGORY_URLS.length} predefined categories...`);
    
    let processed = 0;
    let added = 0;
    let skipped = 0;
    
    for (const url of PREDEFINED_CATEGORY_URLS) {
      processed++;
      
      if (processed % 50 === 0) {
        this.logger.log(`📊 Progress: ${processed}/${PREDEFINED_CATEGORY_URLS.length} categories processed`);
      }
      
      try {
        // Extract category info from URL
        const hierarchyInfo = getCategoryHierarchyFromUrl(url);
        
        if (!hierarchyInfo.allegroId) {
          this.logger.warn(`⚠️  No Allegro ID found in URL: ${url}`);
          skipped++;
          continue;
        }
        
        // Skip if already exists
        if (categoriesMap.has(hierarchyInfo.allegroId)) {
          this.logger.debug(`⏭️  Category already exists: ${hierarchyInfo.allegroId}`);
          skipped++;
          continue;
        }
        
        // Validate URL exists before scraping
        const isValid = await this.validateCategoryUrl(url);
        if (!isValid) {
          this.logger.warn(`❌ Invalid URL skipped: ${url}`);
          skipped++;
          continue;
        }
        
        // Scrape category info
        const category = await this.scrapeSingleCategory(url, hierarchyInfo, categoriesMap);
        if (category) {
          categoriesMap.set(category.allegroId, category);
          added++;
          this.logger.debug(`✅ Added predefined category: ${category.name} (Level ${category.level}, ID: ${category.allegroId})`);
        }
        
        // Rate limiting
        await this.sleep(500);
        
      } catch (error) {
        this.logger.warn(`❌ Failed to scrape predefined category ${url}:`, error.message);
        skipped++;
      }
    }
    
    this.logger.log(`📊 Predefined categories summary: ${added} added, ${skipped} skipped, ${processed} total processed`);
  }

  /**
   * Validate that a category URL exists and is accessible
   */
  private async validateCategoryUrl(url: string): Promise<boolean> {
    try {
      const response = await this.httpClient.get(url, { timeout: 10000 });
      return response.status === 200;
    } catch (error) {
      this.logger.debug(`URL validation failed for ${url}:`, error.message);
      return false;
    }
  }

  /**
   * Scrape a single category from a URL with hierarchy information
   */
  private async scrapeSingleCategory(url: string, hierarchyInfo: { level: number; allegroId: string | null; categoryPath: string[] }, categoriesMap: Map<string, Category>): Promise<Category | null> {
    if (!hierarchyInfo.allegroId) {
      return null;
    }
    
    try {
      const response = await this.httpClient.get(url);
      const $ = cheerio.load(response.data);
      
      // Extract category name
      let categoryName = hierarchyInfo.categoryPath[hierarchyInfo.categoryPath.length - 1];
      
      // Try to get better category name from page content
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
      
      // Determine parent ID based on hierarchy
      let parentId: string | null = null;
      if (hierarchyInfo.level > 1) {
        // For level 2+, try to find parent from URL structure or existing categories
        const urlParts = url.split('/kategoria/')[1]?.split('-');
        if (urlParts && urlParts.length > 2) {
          // Look for parent category in existing map
          const possibleParentPath = urlParts.slice(0, -2).join('-');
          for (const [id, category] of categoriesMap.entries()) {
            if (category.url && category.url.includes(possibleParentPath) && category.level === hierarchyInfo.level - 1) {
              parentId = id;
              break;
            }
          }
        }
      }
      
      // Create category
      const englishName = translateCategory(categoryName);
      const autoRivenId = this.getNextAutoRivenId();
      const category: Category = {
        id: hierarchyInfo.allegroId,
        name: categoryName,
        nameEn: englishName,
        slug: createSlug(categoryName),
        englishSlug: createEnglishSlug(englishName),
        url: url,
        englishUrl: createAutoRivenUrl(createEnglishSlug(englishName), autoRivenId),
        autoRivenId,
        level: hierarchyInfo.level,
        parentId,
        allegroId: hierarchyInfo.allegroId,
        hasProducts: true,
        productCount: this.extractProductCount(response.data)
      };
      
      return category;
      
    } catch (error) {
      this.logger.debug(`Failed to scrape single category ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Save scraped categories to PostgreSQL database
   * This method handles the hierarchical structure by saving categories level by level
   */
  async saveCategoriesToDatabase(categories: Category[]): Promise<{ 
    savedCategories: number; 
    savedSubcategories: number;
    errors: string[];
  }> {
    this.logger.log('💾 Starting to save categories to PostgreSQL database...');
    
    const errors: string[] = [];
    let savedCategoriesCount = 0;
    let savedSubcategoriesCount = 0;

    try {
      // Sort categories by level to ensure parents are saved before children
      const sortedCategories = [...categories].sort((a, b) => a.level - b.level);
      
      // Map to store Allegro ID -> Database UUID mapping
      const idMapping = new Map<string, string>();
      
      this.logger.log(`📊 Processing ${sortedCategories.length} categories...`);

      for (const category of sortedCategories) {
        try {
          if (category.level === 1) {
            // Save as main Category (Level 1)
            await this.saveCategoryEntity(category, idMapping);
            savedCategoriesCount++;
          } else {
            // Save as Subcategory (Levels 2, 3, 4)
            await this.saveSubcategoryEntity(category, idMapping);
            savedSubcategoriesCount++;
          }
        } catch (error) {
          const errorMsg = `Failed to save category ${category.name} (${category.allegroId}): ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      this.logger.log(`✅ Database save completed!`);
      this.logger.log(`   📦 Main categories saved: ${savedCategoriesCount}`);
      this.logger.log(`   📦 Subcategories saved: ${savedSubcategoriesCount}`);
      
      if (errors.length > 0) {
        this.logger.warn(`⚠️  Encountered ${errors.length} errors during save`);
      }

      return {
        savedCategories: savedCategoriesCount,
        savedSubcategories: savedSubcategoriesCount,
        errors,
      };

    } catch (error) {
      this.logger.error('❌ Critical error during database save:', error);
      throw error;
    }
  }

  /**
   * Save a main category (Level 1) to the database
   */
  private async saveCategoryEntity(
    category: Category,
    idMapping: Map<string, string>,
  ): Promise<void> {
    // Check if category already exists by allegroId or autoRivenId
    let existingCategory = await this.categoryRepository.findOne({
      where: [
        { allegroId: category.allegroId },
        { autoRivenId: category.autoRivenId },
      ],
    });

    if (existingCategory) {
      // Update existing category
      existingCategory.name = category.name;
      existingCategory.nameEn = category.nameEn;
      existingCategory.slug = category.slug;
      existingCategory.englishSlug = category.englishSlug;
      existingCategory.allegroUrl = category.url;
      existingCategory.englishUrl = category.englishUrl;
      existingCategory.autoRivenId = category.autoRivenId;
      existingCategory.level = 0; // Main categories are always level 0 in entity
      existingCategory.hasProducts = category.hasProducts;
      existingCategory.productCount = category.productCount;

      const savedCategory = await this.categoryRepository.save(existingCategory);
      idMapping.set(category.allegroId, savedCategory.id);
      
      this.logger.debug(`✏️  Updated category: ${category.name} (AutoRiven ID: ${category.autoRivenId})`);
    } else {
      // Create new category
      const newCategory = this.categoryRepository.create({
        name: category.name,
        nameEn: category.nameEn,
        slug: category.slug,
        englishSlug: category.englishSlug,
        allegroId: category.allegroId,
        autoRivenId: category.autoRivenId,
        allegroUrl: category.url,
        englishUrl: category.englishUrl,
        level: 0, // Main categories are always level 0 in entity
        hasProducts: category.hasProducts,
        productCount: category.productCount,
        isActive: true,
      });

      const savedCategory = await this.categoryRepository.save(newCategory);
      idMapping.set(category.allegroId, savedCategory.id);
      
      this.logger.debug(`✅ Created category: ${category.name} (AutoRiven ID: ${category.autoRivenId})`);
    }
  }

  /**
   * Save a subcategory (Levels 2, 3, 4) to the database
   */
  private async saveSubcategoryEntity(
    category: Category,
    idMapping: Map<string, string>,
  ): Promise<void> {
    // Check if subcategory already exists
    let existingSubcategory = await this.subcategoryRepository.findOne({
      where: [
        { allegroId: category.allegroId },
        { autoRivenId: category.autoRivenId },
      ],
    });

    // Find the main category (Level 1 parent)
    const mainCategoryId = this.findMainCategoryId(category, idMapping);
    if (!mainCategoryId) {
      throw new Error(`Could not find main category for subcategory ${category.name}`);
    }

    // Find the direct parent (if level > 2)
    let parentSubcategoryId: string | null = null;
    if (category.level > 2 && category.parentId) {
      parentSubcategoryId = idMapping.get(category.parentId) || null;
    }

    if (existingSubcategory) {
      // Update existing subcategory
      existingSubcategory.name = category.name;
      existingSubcategory.nameEn = category.nameEn;
      existingSubcategory.slug = category.slug;
      existingSubcategory.englishSlug = category.englishSlug;
      existingSubcategory.allegroUrl = category.url;
      existingSubcategory.englishUrl = category.englishUrl;
      existingSubcategory.autoRivenId = category.autoRivenId;
      existingSubcategory.level = category.level;
      existingSubcategory.categoryId = mainCategoryId;
      existingSubcategory.parentId = parentSubcategoryId;
      existingSubcategory.hasProducts = category.hasProducts;
      existingSubcategory.productCount = category.productCount;

      const savedSubcategory = await this.subcategoryRepository.save(existingSubcategory);
      idMapping.set(category.allegroId, savedSubcategory.id);
      
      this.logger.debug(`✏️  Updated subcategory: ${category.name} (Level ${category.level}, AutoRiven ID: ${category.autoRivenId})`);
    } else {
      // Create new subcategory
      const newSubcategory = this.subcategoryRepository.create({
        name: category.name,
        nameEn: category.nameEn,
        slug: category.slug,
        englishSlug: category.englishSlug,
        allegroId: category.allegroId,
        autoRivenId: category.autoRivenId,
        allegroUrl: category.url,
        englishUrl: category.englishUrl,
        level: category.level,
        categoryId: mainCategoryId,
        parentId: parentSubcategoryId,
        hasProducts: category.hasProducts,
        productCount: category.productCount,
        isActive: true,
      });

      const savedSubcategory = await this.subcategoryRepository.save(newSubcategory);
      idMapping.set(category.allegroId, savedSubcategory.id);
      
      this.logger.debug(`✅ Created subcategory: ${category.name} (Level ${category.level}, AutoRiven ID: ${category.autoRivenId})`);
    }
  }

  /**
   * Find the main category (Level 1) ID for a subcategory by traversing up the hierarchy
   */
  private findMainCategoryId(
    category: Category,
    idMapping: Map<string, string>,
  ): string | null {
    // If this is a Level 2 category, its parent is the main category
    if (category.level === 2 && category.parentId) {
      return idMapping.get(category.parentId) || null;
    }

    // For Level 3 and 4, we need to traverse up to find Level 1
    // The parentId chain should lead us to Level 1
    let currentParentId = category.parentId;
    let iterations = 0;
    const maxIterations = 10; // Safety check

    while (currentParentId && iterations < maxIterations) {
      // Check if this parent is in our mapping
      const parentUuid = idMapping.get(currentParentId);
      if (parentUuid) {
        // Check if this is a main category by checking if it exists in categoryRepository
        // For now, we'll assume the first parent in level order is the main category
        // This works because we save level 1 first
        return parentUuid;
      }
      iterations++;
    }

    // Fallback: find any Level 1 category as the main category
    for (const [allegroId, uuid] of idMapping.entries()) {
      // Level 1 categories have 3-digit Allegro IDs typically
      if (allegroId.length <= 4) {
        return uuid;
      }
    }

    return null;
  }
}