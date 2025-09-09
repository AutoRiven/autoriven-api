#!/usr/bin/env ts-node

import { writeFileSync } from 'fs';
import { join } from 'path';
import axios from 'axios';
import { Category, ScrapingResult } from '../src/scraping/interfaces/scraping.interface';

async function main() {
  console.log('🚀 Starting Direct Allegro Category Scraper...\n');
  
  try {
    const scrapedCategories = new Map<string, Category>();
    
    // Try direct scraping without proxy
    await scrapeDirectly(scrapedCategories);
    
    const categories = Array.from(scrapedCategories.values());
    const result: ScrapingResult = {
      scrapedAt: new Date().toISOString(),
      totalCategories: categories.length,
      method: 'Direct scraping (no proxy)',
      levelBreakdown: calculateLevelBreakdown(categories),
      categories,
    };
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `allegro-categories-direct-${timestamp}.json`;
    const outputPath = join(__dirname, '..', 'results', filename);
    
    writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    console.log('\n✅ Direct scraping completed successfully!');
    console.log(`📊 Total categories found: ${result.totalCategories}`);
    console.log(`📈 Level breakdown:`, result.levelBreakdown);
    console.log(`💾 Results saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Direct scraping failed:', error);
    console.log('\n💡 This is expected as Allegro likely blocks direct requests.');
    console.log('💡 The proxy-based scraper should be used, but it seems to have connectivity issues.');
    console.log('💡 For now, you can use the mock data or check the scrape.do service status.');
    process.exit(1);
  }
}

async function scrapeDirectly(scrapedCategories: Map<string, Category>) {
  console.log('🌐 Trying direct request to Allegro...');
  
  const url = 'https://allegro.pl/kategoria/motoryzacja-19453';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
  };
  
  const response = await axios.get(url, { 
    headers, 
    timeout: 10000
  });
  
  if (response.status === 200 && response.data) {
    console.log('✅ Direct request succeeded! (This is unexpected but good)');
    
    // Create a basic category from the successful response
    const mainCategory: Category = {
      id: '19453',
      name: 'Motoryzacja',
      nameEn: 'Automotive',
      slug: 'motoryzacja',
      url: url,
      level: 1,
      parentId: null,
      allegroId: '19453',
      hasProducts: true,
      productCount: extractProductCount(response.data as string)
    };
    
    scrapedCategories.set(mainCategory.id, mainCategory);
  }
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
