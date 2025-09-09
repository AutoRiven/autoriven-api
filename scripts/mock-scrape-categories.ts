#!/usr/bin/env ts-node

import { writeFileSync } from 'fs';
import { join } from 'path';
import { Category, ScrapingResult } from '../src/scraping/interfaces/scraping.interface';

async function main() {
  console.log('🚀 Starting Mock Allegro Category Scraper...\n');
  
  try {
    const scrapedCategories = new Map<string, Category>();
    
    // Create mock automotive categories
    await createMockAutomotiveCategories(scrapedCategories);
    
    const categories = Array.from(scrapedCategories.values());
    const result: ScrapingResult = {
      scrapedAt: new Date().toISOString(),
      totalCategories: categories.length,
      method: 'Mock data for testing',
      levelBreakdown: calculateLevelBreakdown(categories),
      categories,
    };
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `allegro-categories-mock-${timestamp}.json`;
    const outputPath = join(__dirname, '..', 'results', filename);
    
    writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    console.log('\n✅ Mock scraping completed successfully!');
    console.log(`📊 Total categories found: ${result.totalCategories}`);
    console.log(`📈 Level breakdown:`, result.levelBreakdown);
    console.log(`💾 Results saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Mock scraping failed:', error);
    process.exit(1);
  }
}

async function createMockAutomotiveCategories(scrapedCategories: Map<string, Category>) {
  console.log('🚗 Creating mock automotive categories...');
  
  // Main automotive category
  const mainCategory: Category = {
    id: '19453',
    name: 'Motoryzacja',
    nameEn: 'Automotive',
    slug: 'motoryzacja',
    url: 'https://allegro.pl/kategoria/motoryzacja-19453',
    level: 1,
    parentId: null,
    allegroId: '19453',
    hasProducts: true,
    productCount: 125000
  };
  
  scrapedCategories.set(mainCategory.id, mainCategory);
  
  // Mock subcategories
  const subcategories = [
    { id: '19454', name: 'Części samochodowe', nameEn: 'Car Parts', productCount: 85000 },
    { id: '19455', name: 'Akcesoria samochodowe', nameEn: 'Car Accessories', productCount: 25000 },
    { id: '19456', name: 'Opony i felgi', nameEn: 'Tires and Wheels', productCount: 15000 },
    { id: '19457', name: 'Silniki i osprzęt', nameEn: 'Engines and Equipment', productCount: 12000 },
    { id: '19458', name: 'Układ hamulcowy', nameEn: 'Brake System', productCount: 8000 },
    { id: '19459', name: 'Układ elektryczny', nameEn: 'Electrical System', productCount: 10000 },
    { id: '19460', name: 'Karoseria', nameEn: 'Body Parts', productCount: 20000 },
    { id: '19461', name: 'Wnętrze samochodu', nameEn: 'Car Interior', productCount: 7000 },
    { id: '19462', name: 'Tuning', nameEn: 'Tuning', productCount: 5000 },
    { id: '19463', name: 'Narzędzia i chemia', nameEn: 'Tools and Chemicals', productCount: 8000 }
  ];
  
  for (const subcat of subcategories) {
    const category: Category = {
      id: subcat.id,
      name: subcat.name,
      nameEn: subcat.nameEn,
      slug: createSlug(subcat.name),
      url: `https://allegro.pl/kategoria/${createSlug(subcat.name)}-${subcat.id}`,
      level: 2,
      parentId: mainCategory.id,
      allegroId: subcat.id,
      hasProducts: true,
      productCount: subcat.productCount
    };
    
    scrapedCategories.set(category.id, category);
    console.log(`  📂 Added: ${category.name} (${category.productCount} products)`);
  }
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (match) => {
      const map: Record<string, string> = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n',
        'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z'
      };
      return map[match] || match;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
