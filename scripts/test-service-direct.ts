import { ScrapingService } from '../src/scraping/scraping.service';
import { ConfigService } from '@nestjs/config';

// Mock ConfigService for testing
class MockConfigService extends ConfigService {
  private mockConfig = {
    'ALLEGRO_BASE_URL': 'https://allegro.pl',
    'SCRAPE_DO_TOKEN': 'cfe6c68d-a7d6-42a9-9d91-3a5cfdc6f8bb'
  };

  get<T = any>(propertyPath: string, defaultValue?: T): T {
    return this.mockConfig[propertyPath] || defaultValue;
  }
}

async function testScrapingService() {
  console.log('🧪 Testing Scraping Service directly...');
  
  try {
    // Create mock config service
    const configService = new MockConfigService();
    
    // Create scraping service
    const scrapingService = new ScrapingService(configService);
    
    // Test the scraping
    console.log('🚀 Starting category scraping...');
    const result = await scrapingService.scrapeAllCategories();
    
    console.log('✅ Scraping completed successfully!');
    console.log(`📊 Total categories: ${result.totalCategories}`);
    console.log(`📈 Level breakdown:`, result.levelBreakdown);
    
    // Show some sample categories by level
    const categoriesByLevel = {};
    result.categories.forEach(cat => {
      if (!categoriesByLevel[cat.level]) categoriesByLevel[cat.level] = [];
      categoriesByLevel[cat.level].push(cat);
    });
    
    Object.keys(categoriesByLevel).forEach(level => {
      const cats = categoriesByLevel[level];
      console.log(`\nLevel ${level} (${cats.length} categories):`);
      cats.slice(0, 5).forEach(cat => {
        console.log(`  - ${cat.name} (${cat.allegroId}) - Parent: ${cat.parentId}`);
      });
      if (cats.length > 5) {
        console.log(`  ... and ${cats.length - 5} more`);
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the test
testScrapingService().catch(console.error);
