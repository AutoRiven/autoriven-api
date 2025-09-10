import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ScrapingService } from '../src/scraping/scraping.service';

async function debugLevel2Extraction() {
  console.log('🔍 Starting Level 2 Category Extraction Debug...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const scrapingService = app.get(ScrapingService);
  
  try {
    // Skip proxy test and go directly to scraping
    console.log('🔍 Skipping proxy test, going directly to scraping...');
    
    // Get base page HTML
    console.log('📄 Fetching base page HTML...');
    const httpClient = (scrapingService as any).httpClient;
    const response = await httpClient.get('https://allegro.pl/kategoria/czesci-samochodowe-620');
    console.log(`📄 Got ${response.data.length} characters of HTML`);
    
    // Extract level 2 categories
    console.log('🔍 Extracting level 2 categories...');
    const level2Categories = (scrapingService as any).extractMainSubcategories(response.data, '620');
    
    console.log(`\n📋 Found ${level2Categories.length} level 2 categories:`);
    level2Categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.allegroId}) - ${cat.url}`);
    });
    
    // Check for duplicate IDs
    const ids = level2Categories.map(c => c.allegroId);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.log(`\n⚠️  Found duplicate IDs: ${ids.length} total, ${uniqueIds.size} unique`);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log(`Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);
    } else {
      console.log(`\n✅ All IDs are unique`);
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
  } finally {
    await app.close();
  }
}

debugLevel2Extraction().catch(console.error);
