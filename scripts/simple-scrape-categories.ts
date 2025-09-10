#!/usr/bin/env ts-node

import { writeFileSync } from 'fs';
import { join } from 'path';
import { ScrapingHttpClient } from '../src/scraping/utils/http-client.util';
import { translateCategory, createSlug } from '../src/scraping/utils/translations.util';
import { Category, ScrapingResult } from '../src/scraping/interfaces/scraping.interface';
import * as cheerio from 'cheerio';

async function main() {
  console.log('🚀 Starting Simple Allegro Category Scraper (Dynamic Approach)...\n');
  
  try {
    const config = {
      proxyToken: process.env.SCRAPE_DO_TOKEN || 'YOUR_TOKEN_HERE',
      baseUrl: 'https://allegro.pl',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      requestDelay: 2000,
      maxRetries: 3,
    };
    
    const httpClient = new ScrapingHttpClient(config);
    const scrapedCategories = new Map<string, Category>();
    
    // Test proxy connection first
    console.log('🔍 Testing proxy connection...');
    await testProxyConnection(httpClient);
    
    // Start with the base automotive parts category (NO HARDCODED DATA)
    const baseUrl = 'https://allegro.pl/kategoria/czesci-samochodowe-620';
    await scrapeFromBaseCategory(httpClient, baseUrl, scrapedCategories);
    
    const categories = Array.from(scrapedCategories.values());
    const result: ScrapingResult = {
      scrapedAt: new Date().toISOString(),
      totalCategories: categories.length,
      method: 'Pure dynamic scraping from base automotive category - NO HARDCODED DATA',
      levelBreakdown: calculateLevelBreakdown(categories),
      categories,
    };
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `allegro-categories-${timestamp}.json`;
    const outputPath = join(__dirname, '..', 'results', filename);
    
    writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    console.log('\n✅ Scraping completed successfully!');
    console.log(`📊 Total categories found: ${result.totalCategories}`);
    console.log(`📈 Level breakdown:`, result.levelBreakdown);
    console.log(`💾 Results saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

/**
 * Test proxy connection
 */
async function testProxyConnection(httpClient: ScrapingHttpClient): Promise<void> {
  try {
    const testUrl = 'https://httpbin.org/get';
    const response = await httpClient.get(testUrl, { timeout: 10000 });
    
    if (response.status === 200) {
      console.log('✅ Proxy connection test successful');
    }
  } catch (error) {
    console.error('❌ Proxy connection test failed:', error.message);
    throw new Error(`Proxy test failed: ${error.message}. Check your SCRAPE_DO_TOKEN and proxy configuration.`);
  }
}

/**
 * Scrape categories starting from the base automotive parts URL
 */
async function scrapeFromBaseCategory(
  httpClient: ScrapingHttpClient, 
  baseUrl: string, 
  categoriesMap: Map<string, Category>
): Promise<void> {
  console.log(`🎯 Starting dynamic scraping from base URL: ${baseUrl}`);
  
  try {
    // Scrape the base category page
    const response = await httpClient.get(baseUrl);
    
    // Extract base category info from URL
    const baseIdMatch = baseUrl.match(/\/kategoria\/[^-]+-(\d+)/);
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
          categoryName = cleanCategoryName(titleText);
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
      productCount: extractProductCount(response.data)
    };
    
    categoriesMap.set(baseCategory.allegroId, baseCategory);
    console.log(`✅ Added base category: ${baseCategory.name} (ID: ${baseCategory.allegroId})`);
    
    // Extract all subcategories from this page
    const subcategories = extractCategoriesFromPage(response.data, 2, baseCategory.allegroId);
    console.log(`📋 Found ${subcategories.length} level 2 categories from base page`);
    
    // Add subcategories and scrape deeper levels
    for (const category of subcategories) {
      if (!categoriesMap.has(category.allegroId)) {
        categoriesMap.set(category.allegroId, category);
        console.log(`✅ Added level 2 category: ${category.name} (ID: ${category.allegroId})`);
        
        // For the test script, limit depth to avoid too many requests
        try {
          await scrapeSubcategoriesRecursively(httpClient, category, categoriesMap, 3, 3);
          await sleep(2000);
        } catch (subError) {
          console.warn(`Failed to scrape subcategories for ${category.name}:`, subError.message);
        }
      }
    }
    
    console.log(`✅ Completed scraping from base category. Total categories: ${categoriesMap.size}`);
    
  } catch (error) {
    console.error(`❌ Failed to scrape from base category ${baseUrl}:`, error.message);
    throw error;
  }
}

/**
 * Recursively scrape subcategories to specified depth
 */
async function scrapeSubcategoriesRecursively(
  httpClient: ScrapingHttpClient,
  parentCategory: Category,
  categoriesMap: Map<string, Category>,
  level: number,
  maxLevel: number = 3
): Promise<void> {
  if (level > maxLevel) {
    console.log(`Reached maximum depth (${maxLevel}) for category: ${parentCategory.name}`);
    return;
  }
  
  try {
    console.log(`🔍 Scraping level ${level} subcategories for: ${parentCategory.name}`);
    
    const response = await httpClient.get(parentCategory.url);
    const subcategories = extractCategoriesFromPage(response.data, level, parentCategory.allegroId);
    
    console.log(`Found ${subcategories.length} subcategories at level ${level} for ${parentCategory.name}`);
    
    for (const subcategory of subcategories) {
      if (!categoriesMap.has(subcategory.allegroId)) {
        categoriesMap.set(subcategory.allegroId, subcategory);
        
        // Continue recursively if not at max level
        if (level < maxLevel) {
          await scrapeSubcategoriesRecursively(httpClient, subcategory, categoriesMap, level + 1, maxLevel);
        }
        
        // Small delay between subcategory requests
        await sleep(500);
      }
    }
    
  } catch (error) {
    console.warn(`Failed to scrape subcategories for ${parentCategory.name} at level ${level}:`, error.message);
  }
}

/**
 * Extract categories from HTML page using multiple selector strategies
 */
function extractCategoriesFromPage(html: string, level: number, parentId: string | null): Category[] {
  const $ = cheerio.load(html);
  const categories: Category[] = [];
  
  // Enhanced selector strategies for modern Allegro website
  const selectors = [
    // Category navigation selectors
    'a[href*="/kategoria/"]',
    'a[data-role="category-link"]',
    'a[data-analytics-category-id]',
    
    // Modern component selectors
    '[data-testid="category-tile"] a',
    '[data-testid="subcategory-link"]',
    '.category-card a',
    '.subcategory-item a',
    
    // Generic navigation selectors
    '.category-nav a[href*="/kategoria/"]',
    '.sidebar-nav a[href*="/kategoria/"]',
    '.breadcrumb a[href*="/kategoria/"]',
    
    // Fallback selectors
    'nav a[href*="/kategoria/"]',
    '.menu a[href*="/kategoria/"]',
    '.navigation a[href*="/kategoria/"]'
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
          
          // Extract category ID from URL
          const idMatch = href.match(/\/kategoria\/[^-]+-(\d+)/);
          if (idMatch && idMatch[1]) {
            const allegroId = idMatch[1];
            const categoryName = cleanCategoryName(text);
            
            if (categoryName && categoryName.length > 2 && allegroId !== parentId) {
              const category: Category = {
                id: allegroId,
                name: categoryName,
                nameEn: translateCategory(categoryName),
                slug: createSlug(categoryName),
                url: href.startsWith('http') ? href : `https://allegro.pl${href}`,
                level,
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
  
  // Remove duplicates by allegroId
  const uniqueCategories = categories.filter((category, index, self) => 
    index === self.findIndex(c => c.allegroId === category.allegroId)
  );
  
  console.log(`Extracted ${uniqueCategories.length} unique categories at level ${level}`);
  return uniqueCategories;
}

/**
 * Extract product count from page content
 */
function extractProductCount(html: string): number {
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
 * Extract product count from link element
 */
function extractProductCountFromLink($link: cheerio.Cheerio<any>): number {
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
function cleanCategoryName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]/g, '')
    .trim();
}

/**
 * Calculate level breakdown for result
 */
function calculateLevelBreakdown(categories: Category[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  for (const category of categories) {
    const level = category.level.toString();
    breakdown[level] = (breakdown[level] || 0) + 1;
  }
  
  return breakdown;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
