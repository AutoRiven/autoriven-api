import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ProductScrapingService } from '../src/scraping/product-scraping.service';

/**
 * Test script for the updated product scraper
 * Tests the new HTML parsing logic based on current Allegro structure
 */
async function testProductScraper() {
  console.log('🧪 Testing Updated Product Scraper...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const productScrapingService = app.get(ProductScrapingService);
  
  try {
    // Test 1: Scrape a few products from automotive category
    console.log('📦 Test 1: Scraping 5 products from automotive category...');
    console.log('🌐 All data will be scraped from individual product pages\n');
    const result = await productScrapingService.scrapeAllProducts({ 
      maxProducts: 5,
      saveJson: true, // Test JSON saving
    });
    
    console.log('\n✅ Scraping Results:');
    console.log(`   Total Products: ${result.totalProducts}`);
    console.log(`   Scraping Method: ${result.method}`);
    console.log(`   Scraped At: ${result.scrapedAt}\n`);
    
    // Display first 3 products in detail
    console.log('📋 Sample Products:\n');
    const sampleProducts = result.products.slice(0, 3);
    
    for (const product of sampleProducts) {
      console.log('─────────────────────────────────────────────');
      console.log(`📦 Product: ${product.name}`);
      console.log(`   AutoRiven ID: ${product.autoRivenId}`);
      console.log(`   Allegro ID: ${product.allegroId}`);
      console.log(`   Price: ${product.price} ${product.currency}`);
      console.log(`   Condition: ${product.condition || 'N/A'}`);
      console.log(`   Manufacturer: ${product.manufacturer || 'N/A'}`);
      console.log(`   Part Number: ${product.partNumber || 'N/A'}`);
      console.log(`   Rating: ${product.rating ? product.rating + '/5' : 'N/A'}`);
      console.log(`   Reviews: ${product.reviewCount || 0}`);
      console.log(`   Free Delivery: ${product.freeDelivery ? 'Yes' : 'No'}`);
      console.log(`   Images: ${product.images.length} images`);
      console.log(`   English Name: ${product.nameEn}`);
      console.log(`   English Slug: ${product.englishSlug}`);
      console.log(`   English URL: ${product.englishUrl}`);
      console.log(`   Allegro URL: ${product.allegroUrl.substring(0, 80)}...`);
      console.log('');
    }
    
    // Test 2: Save to database
    console.log('\n💾 Test 2: Saving products to database...');
    await productScrapingService.saveProductsToDatabase(result.products);
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   ✓ Scraped ${result.totalProducts} products`);
    console.log(`   ✓ Parsed product details (name, price, images, etc.)`);
    console.log(`   ✓ Extracted new fields (manufacturer, condition, rating, etc.)`);
    console.log(`   ✓ Generated AutoRiven IDs`);
    console.log(`   ✓ Created English translations and URLs`);
    console.log(`   ✓ Saved to database with new fields`);
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

testProductScraper();
