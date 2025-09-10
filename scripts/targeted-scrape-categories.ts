import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Proxy configuration for Scrape.do
const token = 'cfe6c68d-a7d6-42a9-9d91-3a5cfdc6f8bb';
const proxy = {
  host: 'proxy.scrape.do',
  port: 8080,
  auth: {
    username: token,
    password: 'super=true'
  }
};

const httpClient = axios.create({
  proxy,
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  httpsAgent: new (require('https').Agent)({
    rejectUnauthorized: false // Allow self-signed certificates for proxy
  })
});

interface Category {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  url: string;
  level: number;
  parentId: string | null;
  allegroId: string;
  hasProducts: boolean;
  productCount: number;
}

interface ScrapingResult {
  scrapedAt: string;
  categoriesCount: number;
  levelBreakdown: Record<string, number>;
  categories: Category[];
}

const BASE_URL = 'http://allegro.pl';
const BASE_CATEGORY_URL = 'http://allegro.pl/kategoria/czesci-samochodowe-620';

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (match) => {
      const polishChars = { 'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z' };
      return polishChars[match] || match;
    })
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function translateCategory(polishName: string): string {
  const translations = {
    'części samochodowe': 'automotive parts',
    'części karoserii': 'body parts',
    'oświetlenie': 'lighting',
    'silniki i osprzęt': 'engines and equipment',
    'układ chłodzenia': 'cooling system',
    'układ elektryczny': 'electrical system',
    'układ zapłonu': 'ignition system',
    'układ hamulcowy': 'brake system',
    'układ klimatyzacji': 'air conditioning system',
    'układ napędowy': 'drive system',
    'układ paliwowy': 'fuel system',
    'układ wydechowy': 'exhaust system',
    'układ zawieszenia': 'suspension system',
    'wyposażenie wnętrza': 'interior equipment',
    'tuning mechaniczny': 'mechanical tuning',
    'ogrzewanie postojowe': 'parking heater',
    'chłodnictwo samochodowe': 'automotive refrigeration'
  };
  
  return translations[polishName.toLowerCase()] || polishName;
}

function cleanCategoryName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]/g, '')
    .trim();
}

function extractProductCount(html: string): number {
  const $ = cheerio.load(html);
  
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

function extractProductCountFromLink($link: any): number {
  try {
    const text = $link.text();
    const countMatch = text.match(/\((\d+)\)/);
    if (countMatch) {
      return parseInt(countMatch[1], 10);
    }
    
    const dataCount = $link.attr('data-count') || $link.attr('data-product-count');
    if (dataCount) {
      return parseInt(dataCount, 10);
    }
    
    return 0;
  } catch (error) {
    return 0;
  }
}

async function testProxyConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing proxy connection...');
    const response = await httpClient.get(BASE_CATEGORY_URL);
    console.log(`✅ Proxy connection successful! Status: ${response.status}`);
    return response.status === 200;
  } catch (error) {
    console.error('❌ Proxy connection failed:', error.message);
    return false;
  }
}

async function scrapeFromBaseCategory(baseUrl: string, categoriesMap: Map<string, Category>): Promise<void> {
  console.log(`🎯 Starting targeted scraping from base URL: ${baseUrl}`);
  
  try {
    const response = await httpClient.get(baseUrl);
    
    const baseIdMatch = baseUrl.match(/\/kategoria\/.*-(\d+)/);
    if (!baseIdMatch || !baseIdMatch[1]) {
      throw new Error('Could not extract category ID from base URL');
    }
    
    const baseId = baseIdMatch[1];
    const baseSlugMatch = baseUrl.match(/\/kategoria\/([^-]+)/);
    const baseSlug = baseSlugMatch ? baseSlugMatch[1] : 'czesci-samochodowe';
    
    const $ = cheerio.load(response.data);
    let categoryName = 'Części samochodowe';
    
    const titleSelectors = ['h1', '.category-title', '.page-title', '[data-role="category-title"]', 'title'];
    
    for (const selector of titleSelectors) {
      const titleElement = $(selector).first();
      if (titleElement.length > 0) {
        const titleText = titleElement.text().trim();
        if (titleText && titleText.length > 0 && !titleText.toLowerCase().includes('allegro')) {
          categoryName = cleanCategoryName(titleText);
          break;
        }
      }
    }
    
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
      productCount: extractProductCount(response.data)
    };
    
    categoriesMap.set(baseCategory.allegroId, baseCategory);
    console.log(`✅ Added base category: ${baseCategory.name} (ID: ${baseCategory.allegroId})`);
    
    const level2Categories = extractMainSubcategories(response.data, baseCategory.allegroId);
    console.log(`📋 Found ${level2Categories.length} level 2 main subcategories`);
    
    for (const level2Category of level2Categories) {
      if (!categoriesMap.has(level2Category.allegroId)) {
        categoriesMap.set(level2Category.allegroId, level2Category);
        console.log(`✅ Added level 2 category: ${level2Category.name} (ID: ${level2Category.allegroId})`);
        
        try {
          await scrapeLevel3Categories(level2Category, categoriesMap);
          await sleep(1000);
        } catch (subError) {
          console.warn(`Failed to scrape level 3 for ${level2Category.name}:`, subError.message);
        }
      }
    }
    
    console.log(`✅ Completed scraping from base category. Total categories: ${categoriesMap.size}`);
    
  } catch (error) {
    console.error(`❌ Failed to scrape from base category ${baseUrl}:`, error.message);
    throw error;
  }
}

function extractMainSubcategories(html: string, parentId: string): Category[] {
  const $ = cheerio.load(html);
  const categories: Category[] = [];
  
  const selectors = [
    'a[href*="/kategoria/czesci-samochodowe-"]',
    'a[href*="/kategoria/czesci-karoserii-"]',
    'a[href*="/kategoria/oswietlenie-"]',
    'a[href*="/kategoria/silniki-i-osprzet-"]',
    'a[href*="/kategoria/uklad-"]',
    'a[href*="/kategoria/wyposazenie-wnetrza-"]',
    'a[href*="/kategoria/tuning-mechaniczny-"]',
    'a[href*="/kategoria/ogrzewanie-postojowe-"]',
    'a[href*="/kategoria/"]'
  ];
  
  const foundLinks = new Set<string>();
  const priorityKeywords = [
    'karoserii', 'oświetlenie', 'silniki', 'osprzęt', 'chłodzenia', 'elektryczny', 
    'zapłon', 'hamulcowy', 'klimatyzacji', 'napędowy', 'paliwowy', 'wydechowy', 
    'zawieszenia', 'wnętrza', 'tuning', 'ogrzewanie', 'chłodnictwo'
  ];
  
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
            const categoryName = cleanCategoryName(text);
            
            const isMainSubcategory = allegroId !== parentId && 
              categoryName.length > 5 && 
              (priorityKeywords.some(keyword => 
                categoryName.toLowerCase().includes(keyword.toLowerCase())
              ) || href.includes('czesci-samochodowe-'));
            
            if (isMainSubcategory) {
              const category: Category = {
                id: allegroId,
                name: categoryName,
                nameEn: translateCategory(categoryName),
                slug: createSlug(categoryName),
                url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
                level: 2,
                parentId,
                allegroId,
                hasProducts: true,
                productCount: extractProductCountFromLink($link)
              };
              
              categories.push(category);
            }
          }
        }
      });
    } catch (error) {
      console.debug(`Error with selector ${selector}:`, error.message);
    }
  }
  
  const uniqueCategories = categories
    .filter((category, index, self) => 
      index === self.findIndex(c => c.allegroId === category.allegroId)
    )
    .sort((a, b) => {
      const aPriority = priorityKeywords.some(k => a.name.toLowerCase().includes(k)) ? 1 : 0;
      const bPriority = priorityKeywords.some(k => b.name.toLowerCase().includes(k)) ? 1 : 0;
      return bPriority - aPriority;
    });
  
  console.debug(`Extracted ${uniqueCategories.length} main subcategories (level 2)`);
  return uniqueCategories;
}

async function scrapeLevel3Categories(level2Category: Category, categoriesMap: Map<string, Category>): Promise<void> {
  console.debug(`🔍 Scraping level 3 categories for: ${level2Category.name}`);
  
  try {
    const response = await httpClient.get(level2Category.url);
    const level3Categories = extractSpecificPartCategories(response.data, level2Category.allegroId);
    
    console.debug(`Found ${level3Categories.length} level 3 categories for ${level2Category.name}`);
    
    for (const level3Category of level3Categories) {
      if (!categoriesMap.has(level3Category.allegroId)) {
        categoriesMap.set(level3Category.allegroId, level3Category);
        console.debug(`✅ Added level 3 category: ${level3Category.name} (ID: ${level3Category.allegroId})`);
        
        try {
          await scrapeLevel4Categories(level3Category, categoriesMap);
          await sleep(500);
        } catch (level4Error) {
          console.debug(`Failed to scrape level 4 for ${level3Category.name}:`, level4Error.message);
        }
      }
    }
    
  } catch (error) {
    console.warn(`Failed to scrape level 3 categories for ${level2Category.name}:`, error.message);
  }
}

function extractSpecificPartCategories(html: string, parentId: string): Category[] {
  const $ = cheerio.load(html);
  const categories: Category[] = [];
  
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
            const categoryName = cleanCategoryName(text);
            
            if (categoryName && categoryName.length > 3 && allegroId !== parentId) {
              const category: Category = {
                id: allegroId,
                name: categoryName,
                nameEn: translateCategory(categoryName),
                slug: createSlug(categoryName),
                url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
                level: 3,
                parentId,
                allegroId,
                hasProducts: true,
                productCount: extractProductCountFromLink($link)
              };
              
              categories.push(category);
            }
          }
        }
      });
    } catch (error) {
      console.debug(`Error with selector ${selector}:`, error.message);
    }
  }
  
  const uniqueCategories = categories.filter((category, index, self) => 
    index === self.findIndex(c => c.allegroId === category.allegroId)
  );
  
  return uniqueCategories;
}

async function scrapeLevel4Categories(level3Category: Category, categoriesMap: Map<string, Category>): Promise<void> {
  console.debug(`🔍 Scraping level 4 categories for: ${level3Category.name}`);
  
  try {
    const response = await httpClient.get(level3Category.url);
    const level4Categories = extractFinalPartCategories(response.data, level3Category.allegroId);
    
    console.debug(`Found ${level4Categories.length} level 4 categories for ${level3Category.name}`);
    
    for (const level4Category of level4Categories) {
      if (!categoriesMap.has(level4Category.allegroId)) {
        categoriesMap.set(level4Category.allegroId, level4Category);
        console.debug(`✅ Added level 4 category: ${level4Category.name} (ID: ${level4Category.allegroId})`);
      }
    }
    
  } catch (error) {
    console.debug(`Failed to scrape level 4 categories for ${level3Category.name}:`, error.message);
  }
}

function extractFinalPartCategories(html: string, parentId: string): Category[] {
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
            const categoryName = cleanCategoryName(text);
            
            if (categoryName && categoryName.length > 3 && allegroId !== parentId) {
              const category: Category = {
                id: allegroId,
                name: categoryName,
                nameEn: translateCategory(categoryName),
                slug: createSlug(categoryName),
                url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
                level: 4,
                parentId,
                allegroId,
                hasProducts: true,
                productCount: extractProductCountFromLink($link)
              };
              
              categories.push(category);
            }
          }
        }
      });
    } catch (error) {
      console.debug(`Error with selector ${selector}:`, error.message);
    }
  }
  
  const uniqueCategories = categories.filter((category, index, self) => 
    index === self.findIndex(c => c.allegroId === category.allegroId)
  );
  
  return uniqueCategories;
}

function calculateLevelBreakdown(categories: Category[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  for (const category of categories) {
    const level = category.level.toString();
    breakdown[level] = (breakdown[level] || 0) + 1;
  }
  
  return breakdown;
}

function saveResults(result: ScrapingResult): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `allegro-categories-targeted-${timestamp}.json`;
  const filepath = join(process.cwd(), 'results', filename);
  
  try {
    writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`📁 Results saved to: ${filepath}`);
  } catch (error) {
    console.error('Failed to save results:', error);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting Allegro Categories Targeted Scraper');
  console.log('=' .repeat(50));
  
  const startTime = Date.now();
  
  // Test proxy connection
  const proxyWorks = await testProxyConnection();
  if (!proxyWorks) {
    console.error('❌ Cannot proceed without working proxy connection');
    process.exit(1);
  }
  
  const categoriesMap = new Map<string, Category>();
  
  try {
    await scrapeFromBaseCategory(BASE_CATEGORY_URL, categoriesMap);
    
    const categories = Array.from(categoriesMap.values());
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    const result: ScrapingResult = {
      scrapedAt: new Date().toISOString(),
      categoriesCount: categories.length,
      levelBreakdown: calculateLevelBreakdown(categories),
      categories: categories.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
      })
    };
    
    console.log('\n📊 Scraping Results:');
    console.log(`Total categories: ${result.categoriesCount}`);
    console.log(`Level breakdown:`, result.levelBreakdown);
    console.log(`Duration: ${duration}s`);
    
    saveResults(result);
    
    console.log('\n✅ Scraping completed successfully!');
    
  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
