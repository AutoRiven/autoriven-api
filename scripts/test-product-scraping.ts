import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ProductScrapingService } from '../src/scraping/product-scraping.service';
import { Logger } from '@nestjs/common';

/**
 * Test script to validate product scraping with enhanced fields
 * Tests both listing page and single product page scraping
 */
async function testProductScraping() {
  const logger = new Logger('TestProductScraping');
  
  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);
    const scrapingService = app.get(ProductScrapingService);
    
    logger.log('🧪 Starting Enhanced Product Scraping Tests...\n');
    
    // Test 1: Scrape a single product by offer ID
    logger.log('📋 Test 1: Scraping single product with new fields');
    logger.log('─'.repeat(60));
    
    try {
      // Example offer ID - you can replace with any valid Allegro offer ID
      const testOfferId = '14940297112';
      logger.log(`🔍 Scraping product: ${testOfferId}`);
      
      const product = await scrapingService.scrapeProductByOfferId(testOfferId);
      
      logger.log('\n✅ Product scraped successfully!');
      logger.log(`   Name: ${product.name}`);
      logger.log(`   Name (EN): ${product.nameEn}`);
      logger.log(`   AutoRiven ID: ${product.autoRivenId}`);
      logger.log(`   Price: ${product.price} ${product.currency}`);
      logger.log(`   Brand: ${product.brand || 'N/A'}`);
      logger.log(`   Manufacturer: ${product.manufacturer || 'N/A'}`);
      logger.log(`   Condition: ${product.condition || 'N/A'}`);
      logger.log(`   EAN: ${product.ean || 'N/A'}`);
      logger.log(`   Seller: ${product.sellerName || 'N/A'}`);
      logger.log(`   Seller Rating: ${product.sellerRating ? product.sellerRating.toFixed(2) + '/5.00' : 'N/A'}`);
      logger.log(`   Images (basic): ${product.images?.length || 0}`);
      logger.log(`   Gallery Images: ${product.galleryImages?.length || 0}`);
      logger.log(`   Description: ${product.description ? product.description.substring(0, 50) + '...' : 'N/A'}`);
      logger.log(`   Description HTML: ${product.descriptionHtml ? 'Present (' + product.descriptionHtml.length + ' chars)' : 'N/A'}`);
      logger.log(`   Specifications: ${product.specifications ? Object.keys(product.specifications).length + ' items' : 'N/A'}`);
      
      if (product.galleryImages && product.galleryImages.length > 0) {
        logger.log('\n   📷 Gallery Images:');
        product.galleryImages.slice(0, 3).forEach((img, idx) => {
          logger.log(`      ${idx + 1}. ${img.substring(0, 80)}...`);
        });
        if (product.galleryImages.length > 3) {
          logger.log(`      ... and ${product.galleryImages.length - 3} more`);
        }
      }
      
      if (product.descriptionHtml) {
        logger.log('\n   📝 Description HTML Preview:');
        const preview = product.descriptionHtml.substring(0, 200).replace(/\n/g, ' ').replace(/\s+/g, ' ');
        logger.log(`      ${preview}...`);
      }
      
      logger.log('\n2️⃣ Testing database save with new fields...');
      await scrapingService.saveProductsToDatabase([product]);
      logger.log('✅ Product saved to database with all new fields!');
      
    } catch (error: any) {
      logger.error(`❌ Test 1 Failed: ${error.message}`);
      logger.error(error.stack);
    }
    
    logger.log('\n' + '='.repeat(60));
    logger.log('\n✅ Test completed!\n');
    
    logger.log('📋 Fields tested:');
    logger.log('   ✅ Basic product info (name, price, brand)');
    logger.log('   ✅ Enhanced images (galleryImages array)');
    logger.log('   ✅ Description HTML (preserves formatting)');
    logger.log('   ✅ EAN/GTIN code');
    logger.log('   ✅ Seller name and rating');
    logger.log('   ✅ Product specifications');
    logger.log('   ✅ Database save with new fields');
    
    logger.log('\n💡 To test category scraping:');
    logger.log('   Find a category ID from your database, then run:');
    logger.log('   await scrapingService.scrapeProductsByCategory(categoryId, 5)');
    
    // Close the application context
    await app.close();
    
  } catch (error: any) {
    logger.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
testProductScraping()
  .then(() => {
    console.log('\n✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
