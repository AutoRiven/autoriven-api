import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ScrapingService } from '../src/scraping/scraping.service';
import { readFileSync } from 'fs';
import { join } from 'path';

async function saveCategoriesFromFile() {
  console.log('🚀 Starting category database save process...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const scrapingService = app.get(ScrapingService);

  try {
    // Find the latest results file
    const resultsDir = join(process.cwd(), 'results');
    const fs = require('fs');
    const files = fs.readdirSync(resultsDir)
      .filter((file: string) => file.startsWith('allegro-categories-') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      throw new Error('No scraping results found. Please run scraping first.');
    }
    
    const latestFile = join(resultsDir, files[0]);
    console.log(`📁 Reading categories from: ${files[0]}`);
    
    const fileContent = readFileSync(latestFile, 'utf-8');
    const data = JSON.parse(fileContent);
    
    console.log(`📊 Found ${data.totalCategories} categories to save`);
    console.log(`📈 Level breakdown:`, data.levelBreakdown);
    
    // Save to database
    const result = await scrapingService.saveCategoriesToDatabase(data.categories);
    
    console.log('\n✅ Database save completed!');
    console.log(`📦 Main categories saved: ${result.savedCategories}`);
    console.log(`📦 Subcategories saved: ${result.savedSubcategories}`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${result.errors.length}`);
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error saving categories:', error);
    throw error;
  } finally {
    await app.close();
  }
}

saveCategoriesFromFile()
  .then(() => {
    console.log('\n✨ Process completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Process failed:', error);
    process.exit(1);
  });
