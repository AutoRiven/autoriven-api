#!/usr/bin/env ts-node

import { writeFileSync } from 'fs';
import { join } from 'path';
import { ScrapingHttpClient } from '../src/scraping/utils/http-client.util';
import { translateCategory, createSlug } from '../src/scraping/utils/translations.util';
import { Category, ScrapingResult } from '../src/scraping/interfaces/scraping.interface';

async function main() {
  console.log('🚀 Starting Simple Allegro Category Scraper...\n');
  
  try {
    const config = {
      proxyToken: process.env.SCRAPE_DO_TOKEN || 'b70dd4da53294062b160bb6953ba0619f32185d1508',
      baseUrl: 'https://allegro.pl',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      requestDelay: 1000,
      maxRetries: 3,
    };
    
    const httpClient = new ScrapingHttpClient(config);
    const scrapedCategories = new Map<string, Category>();
    
    // Start with automotive categories (main focus)
    await scrapeAutomotiveCategories(httpClient, scrapedCategories);
    
    const categories = Array.from(scrapedCategories.values());
    const result: ScrapingResult = {
      scrapedAt: new Date().toISOString(),
      totalCategories: categories.length,
      method: 'Simple scraping with proxy',
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

async function scrapeAutomotiveCategories(httpClient: ScrapingHttpClient, scrapedCategories: Map<string, Category>) {
  console.log('🚗 Scraping automotive categories...');
  
  // Automotive main category URL
  const mainCategoryUrl = 'https://allegro.pl/kategoria/motoryzacja-19453';
  
  try {
    const html = await httpClient.get(mainCategoryUrl);
    
    if (!html) {
      throw new Error('Failed to fetch main automotive category page');
    }
    
    // Parse main automotive category
    const mainCategory: Category = {
      id: '19453',
      name: 'Motoryzacja',
      nameEn: 'Automotive',
      slug: 'motoryzacja',
      url: mainCategoryUrl,
      level: 1,
      parentId: null,
      allegroId: '19453',
      hasProducts: true,
      productCount: extractProductCount(html)
    };
    
    scrapedCategories.set(mainCategory.id, mainCategory);
    
    // Extract subcategories from the HTML
    const subcategoryLinks = extractSubcategoryLinks(html);
    
    for (const link of subcategoryLinks) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        await scrapeSubcategory(httpClient, link, mainCategory.id, scrapedCategories);
      } catch (error) {
        console.error(`Error scraping subcategory ${link.url}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Error scraping automotive categories:', error);
    throw error;
  }
}

async function scrapeSubcategory(
  httpClient: ScrapingHttpClient, 
  link: any, 
  parentId: string, 
  scrapedCategories: Map<string, Category>
) {
  console.log(`  📂 Scraping: ${link.name}`);
  
  const html = await httpClient.get(link.url);
  
  if (!html) {
    console.warn(`    ⚠️ Failed to fetch: ${link.url}`);
    return;
  }
  
  const categoryId = extractCategoryIdFromUrl(link.url);
  const translated = translateCategory(link.name);
  
  const category: Category = {
    id: categoryId,
    name: link.name,
    nameEn: translated,
    slug: createSlug(link.name),
    url: link.url,
    level: 2,
    parentId: parentId,
    allegroId: categoryId,
    hasProducts: true,
    productCount: extractProductCount(html)
  };
  
  scrapedCategories.set(category.id, category);
}

function extractSubcategoryLinks(html: string): Array<{name: string, url: string}> {
  const links: Array<{name: string, url: string}> = [];
  
  // Look for category links in various possible structures
  const patterns = [
    /<a[^>]*href="([^"]*kategoria[^"]*)"[^>]*>([^<]+)<\/a>/gi,
    /<a[^>]*data-analytics-category[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi,
    /<a[^>]*class="[^"]*category[^"]*"[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : `https://allegro.pl${match[1]}`;
      const name = match[2].trim();
      
      if (name && name.length > 2 && !name.includes('Zobacz') && !name.includes('Więcej')) {
        links.push({ name, url });
      }
    }
  }
  
  return links.slice(0, 20); // Limit for testing
}

function extractCategoryIdFromUrl(url: string): string {
  const match = url.match(/kategoria\/[^-]+-(\d+)/);
  return match ? match[1] : Math.random().toString().slice(2, 10);
}

function extractProductCount(html: string): number {
  const patterns = [
    /(\d+(?:\s*\d{3})*)\s*(?:wyników|rezultatów|ofert)/i,
    /Znaleziono\s*(\d+(?:\s*\d{3})*)/i,
    /(\d+(?:\s*\d{3})*)\s*produktów/i
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return parseInt(match[1].replace(/\s/g, ''), 10);
    }
  }
  
  return 0;
}

function calculateLevelBreakdown(categories: Category[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  for (const category of categories) {
    const levelKey = `level${category.level}`;
    breakdown[levelKey] = (breakdown[levelKey] || 0) + 1;
  }
  
  return breakdown;
}

// Run the script
main().catch(console.error);
