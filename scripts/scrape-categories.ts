#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ScrapingService } from '../src/scraping/scraping.service';

async function main() {
  console.log('🚀 Starting Allegro Category Scraper...\n');
  
  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn'],
    });
    
    // Get scraping service
    const scrapingService = app.get(ScrapingService);
    
    // Start scraping
    const result = await scrapingService.scrapeAllCategories();
    
    console.log('\n✅ Scraping completed successfully!');
    console.log(`📊 Total categories found: ${result.totalCategories}`);
    console.log(`📈 Level breakdown:`, result.levelBreakdown);
    
    // Close application
    await app.close();
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
