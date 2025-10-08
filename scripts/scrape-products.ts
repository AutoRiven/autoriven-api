import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ProductScrapingService } from '../src/scraping/product-scraping.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  console.log('🚀 Starting product scraping script...\n');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const categoryIdArg = args.find(arg => arg.startsWith('--category='));
  const offerIdArg = args.find(arg => arg.startsWith('--offer='));
  const maxProductsArg = args.find(arg => arg.startsWith('--max='));
  const saveToDbArg = args.includes('--save');
  const saveJsonArg = args.includes('--json');
  
  const categoryId = categoryIdArg?.split('=')[1];
  const offerId = offerIdArg?.split('=')[1];
  const maxProducts = maxProductsArg ? parseInt(maxProductsArg.split('=')[1]) : undefined;
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const productScrapingService = app.get(ProductScrapingService);
  
  try {
    if (offerId) {
      // Scrape single product by offer ID
      console.log(`🔍 Scraping product with offer ID: ${offerId}\n`);
      
      const product = await productScrapingService.scrapeProductByOfferId(offerId);
      
      console.log('\n✅ Product scraped successfully!');
      console.log(`📦 Product: ${product.name}`);
      console.log(`💰 Price: ${product.price} ${product.currency}`);
      console.log(`🔗 URL: ${product.allegroUrl}`);
      console.log(`🆔 AutoRiven ID: ${product.autoRivenId}`);
      
      if (saveToDbArg) {
        console.log('\n💾 Saving product to database...');
        await productScrapingService.saveProductsToDatabase([product]);
      }
      
    } else if (categoryId) {
      // Scrape products from specific category
      console.log(`🔍 Scraping products from category: ${categoryId}`);
      if (maxProducts) {
        console.log(`📊 Max products: ${maxProducts}`);
      }
      if (saveJsonArg) {
        console.log('📄 Will save JSON results to file');
      }
      console.log('🌐 All product data will be scraped from individual product pages\n');
      
      const result = await productScrapingService.scrapeProductsByCategory(
        categoryId,
        {
          maxProducts,
          saveJson: saveJsonArg,
        },
      );
      
      console.log('\n✅ Product scraping completed!');
      console.log(`📦 Total products: ${result.totalProducts}`);
      console.log(`📁 Category: ${result.categoryName}`);
      
      if (saveToDbArg && result.products.length > 0) {
        console.log('\n💾 Saving products to database...');
        await productScrapingService.saveProductsToDatabase(result.products);
      } else {
        console.log('\n✅ Products already saved to database in real-time');
      }
      
    } else {
      // Scrape all products from all categories
      console.log('🔍 Scraping products from ALL categories in database');
      if (maxProducts) {
        console.log(`📊 Max products per category: ${maxProducts}`);
      }
      if (saveJsonArg) {
        console.log('📄 Will save JSON results to file');
      }
      console.log('🌐 All product data will be scraped from individual product pages');
      console.log('\n⚠️  This may take a very long time!\n');
      
      const result = await productScrapingService.scrapeAllProducts({
        maxProducts,
        saveJson: saveJsonArg,
      });
      
      console.log('\n✅ Product scraping completed!');
      console.log(`📦 Total products: ${result.totalProducts}`);
      
      if (saveToDbArg && result.products.length > 0) {
        console.log('\n💾 Saving products to database...');
        await productScrapingService.saveProductsToDatabase(result.products);
      } else {
        console.log('\n✅ Products already saved to database in real-time');
      }
    }
    
    console.log('\n✨ Process completed successfully!');
    
  } catch (error: any) {
    console.error('\n❌ Error during product scraping:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Show usage if --help is provided
if (process.argv.includes('--help')) {
  console.log(`
🛍️  Product Scraping Script

Usage:
  npm run scrape:products [options]

Options:
  --category=<id>    Scrape products from a specific category ID
  --offer=<id>       Scrape a specific product by Allegro offer ID
  --max=<number>     Maximum number of products to scrape (per category for all, or total for specific category)
  --save             Save scraped products to database (default: real-time saving enabled)
  --json             Save results to JSON file for translation reference

Examples:
  # Scrape all products from all categories with JSON export
  npm run scrape:products -- --max=10 --json

  # Scrape products from specific category
  npm run scrape:products -- --category=abc-123-def --max=50

  # Scrape single product by offer ID
  npm run scrape:products -- --offer=123456789 --save

  # Scrape with JSON export for translation reference
  npm run scrape:products -- --category=abc-123-def --max=20 --json

Note: All product data is automatically scraped from individual product pages for complete details.
      Products are automatically saved to PostgreSQL database in real-time.
      Use --json to also save results to JSON file for translation reference.
  `);
  process.exit(0);
}

bootstrap();
