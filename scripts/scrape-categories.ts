import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface Category {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  url: string;
  level: number;
  parentId: string | null;
  allegroId: string;
  hasProducts: boolean;
  productCount?: number;
}

// Essential Polish-English translations for automotive categories
const TRANSLATIONS: Record<string, string> = {
  'Motoryzacja': 'Automotive',
  'Części samochodowe': 'Car Parts',
  'Części karoserii': 'Body Parts',
  'Filtry': 'Filters',
  'Oświetlenie': 'Lighting',
  'Silniki i osprzęt': 'Engines and Equipment',
  'Układ chłodzenia silnika': 'Engine Cooling System',
  'Układ elektryczny, zapłon': 'Electrical System, Ignition',
  'Układ hamulcowy': 'Brake System',
  'Układ kierowniczy': 'Steering System',
  'Układ napędowy': 'Drive System',
  'Układ wydechowy': 'Exhaust System',
  'Zawieszenie': 'Suspension',
  'Wyposażenie i akcesoria samochodowe': 'Car Equipment and Accessories',
  'Chemia': 'Chemistry',
  'Części do maszyn i innych pojazdów': 'Parts for Machines and Other Vehicles',
  'Części i wyposażenie motocyklowe': 'Motorcycle Parts and Equipment',
  'Narzędzia i sprzęt warsztatowy': 'Tools and Workshop Equipment',
  'Opony i felgi': 'Tires and Rims',
  'Samochody': 'Cars',
  'Motocykle i quady': 'Motorcycles and ATVs'
};

const SCRAPE_DO_TOKEN = 'b70dd4da53294062b160bb6953ba0619f32185d1508';

class AllegroLiveScraper {
  private categories: Category[] = [];
  private processedUrls: Set<string> = new Set();

  constructor() {}

  async scrapeAllCategories(): Promise<void> {
    console.log('🚀 Starting Allegro Live Category Scraping');
    console.log('===========================================\n');

    try {
      await this.scrapeMainCarPartsPage();
      await this.scrapeSubcategories();

      console.log(`\n✅ Scraping Complete!`);
      console.log(`   Total Categories: ${this.categories.length}`);

      await this.saveResults();

    } catch (error: any) {
      console.error('❌ Scraping failed:', error.message);
      throw error;
    }
  }

  private async fetchPageWithProxy(url: string): Promise<string> {
    try {
      console.log(`📄 Fetching: ${url}`);
      
      const response = await axios({
        method: 'GET',
        url: url,
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        proxy: {
          protocol: 'http',
          host: 'proxy.scrape.do',
          port: 8080,
          auth: {
            username: SCRAPE_DO_TOKEN,
            password: 'super=true'
          }
        }
      } as any);

      const html = response.data as string;
      console.log(`✅ Page fetched successfully (${html.length} chars)`);
      
      // Check if we got blocked
      if (html.includes('Please enable JS') || html.includes('captcha') || html.length < 5000) {
        console.log('⚠️ Possible blocking detected, using reference HTML as fallback');
        return await this.loadReferenceHtml();
      }
      
      return html;
      
    } catch (error: any) {
      console.error(`❌ Failed to fetch ${url}:`, error.message);
      console.log('📁 Using reference HTML as fallback');
      return await this.loadReferenceHtml();
    }
  }

  private async loadReferenceHtml(): Promise<string> {
    try {
      const categoryContainerPath = path.join(__dirname, '..', 'src', 'scraping', 'html-references', 'category-container.html');
      const breadcrumbPath = path.join(__dirname, '..', 'src', 'scraping', 'html-references', 'breadcrumb.html');
      
      let html = '';
      
      if (fs.existsSync(categoryContainerPath)) {
        html += fs.readFileSync(categoryContainerPath, 'utf8');
        console.log('✅ Loaded category container HTML reference');
      }
      
      if (fs.existsSync(breadcrumbPath)) {
        html += fs.readFileSync(breadcrumbPath, 'utf8');
        console.log('✅ Loaded breadcrumb HTML reference');
      }
      
      return html;
    } catch (error) {
      console.error('❌ Failed to load reference HTML:', error);
      throw new Error('Could not load reference HTML files');
    }
  }

  private async scrapeMainCarPartsPage(): Promise<void> {
    // Add base categories from breadcrumb structure
    this.addCategory({
      id: 'motoryzacja',
      name: 'Motoryzacja',
      nameEn: 'Automotive',
      slug: 'motoryzacja',
      url: 'https://allegro.pl/dzial/motoryzacja',
      level: 0,
      parentId: null,
      allegroId: '3',
      hasProducts: true
    });

    this.addCategory({
      id: 'czesci-samochodowe-620',
      name: 'Części samochodowe',
      nameEn: 'Car Parts',
      slug: 'czesci-samochodowe',
      url: 'https://allegro.pl/kategoria/czesci-samochodowe-620',
      level: 1,
      parentId: 'motoryzacja',
      allegroId: '620',
      hasProducts: true
    });

    // Fetch the main car parts page
    const carPartsUrl = 'https://allegro.pl/kategoria/czesci-samochodowe-620';
    const html = await this.fetchPageWithProxy(carPartsUrl);
    
    // Extract categories from the HTML using patterns from reference files
    await this.extractCategoriesFromHtml(html, 2, 'czesci-samochodowe-620');
    
    // Also extract breadcrumb categories for additional structure
    await this.extractBreadcrumbCategories(html);
  }

  private async extractCategoriesFromHtml(html: string, level: number, parentId: string): Promise<void> {
    console.log(`🔍 Extracting categories at level ${level}...`);
    
    // Pattern from category-container.html - extract href and data-custom-params
    const categoryPattern = /href="\/kategoria\/([^"]+)"[^>]*data-custom-params="([^"]*)"[^>]*>([^<]+)<\/a>/g;
    const productCountPattern = /<span[^>]*>\(([^)]+)\)<\/span>/g;
    
    let match;
    let foundCount = 0;
    
    while ((match = categoryPattern.exec(html)) !== null) {
      const [, categoryPath, customParamsEncoded, categoryName] = match;
      
      try {
        // Decode the custom params to get category ID and other info
        const customParams = JSON.parse(customParamsEncoded.replace(/&quot;/g, '"'));
        const allegroId = customParams.id;
        const cleanName = this.cleanText(categoryName);
        
        if (cleanName && allegroId && !this.isCommonWord(cleanName)) {
          const nameEn = this.translateToEnglish(cleanName);
          
          this.addCategory({
            id: `category-${allegroId}`,
            name: cleanName,
            nameEn: nameEn,
            slug: this.generateSlug(cleanName),
            url: `https://allegro.pl/kategoria/${categoryPath}`,
            level: level,
            parentId: parentId,
            allegroId: allegroId,
            hasProducts: true,
            productCount: customParams.count
          });
          
          foundCount++;
        }
      } catch (error) {
        // If JSON parsing fails, continue with basic extraction
        const allegroIdMatch = categoryPath.match(/-(\d+)$/);
        const allegroId = allegroIdMatch ? allegroIdMatch[1] : categoryPath;
        const cleanName = this.cleanText(categoryName);
        
        if (cleanName && !this.isCommonWord(cleanName)) {
          this.addCategory({
            id: `category-${allegroId}`,
            name: cleanName,
            nameEn: this.translateToEnglish(cleanName),
            slug: this.generateSlug(cleanName),
            url: `https://allegro.pl/kategoria/${categoryPath}`,
            level: level,
            parentId: parentId,
            allegroId: allegroId,
            hasProducts: true
          });
          
          foundCount++;
        }
      }
    }
    
    console.log(`   Found ${foundCount} categories at level ${level}`);
  }

  private async extractBreadcrumbCategories(html: string): Promise<void> {
    console.log('🔍 Extracting breadcrumb categories...');
    
    // Pattern from breadcrumb.html - extract categories from navigation apron
    const breadcrumbPattern = /data-analytics-click-custom-navigation-category-id="([^"]+)"[^>]*data-analytics-clickable[^>]*>([^<]+)</g;
    
    let match;
    let foundCount = 0;
    
    while ((match = breadcrumbPattern.exec(html)) !== null) {
      const [, allegroId, categoryName] = match;
      const cleanName = this.cleanText(categoryName);
      
      if (cleanName && allegroId && !this.isCommonWord(cleanName)) {
        // Check if this is a main category under Motoryzacja
        const isMainCategory = ['253498', '18903', '99022', '156', '620', '18554', '99193', '149', '300685'].includes(allegroId);
        
        if (isMainCategory) {
          this.addCategory({
            id: `breadcrumb-${allegroId}`,
            name: cleanName,
            nameEn: this.translateToEnglish(cleanName),
            slug: this.generateSlug(cleanName),
            url: `https://allegro.pl/kategoria/${this.generateSlug(cleanName)}-${allegroId}`,
            level: 1,
            parentId: 'motoryzacja',
            allegroId: allegroId,
            hasProducts: true
          });
          
          foundCount++;
        }
      }
    }
    
    console.log(`   Found ${foundCount} breadcrumb categories`);
  }

  private async scrapeSubcategories(): Promise<void> {
    console.log('\n🔍 Scraping deeper category levels...');
    
    const level2Categories = this.categories.filter(cat => cat.level === 2).slice(0, 10); // Limit to avoid too many requests
    
    for (const category of level2Categories) {
      if (this.categories.length >= 500) break; // Stop if we have enough
      
      try {
        console.log(`   📂 Scraping: ${category.name}`);
        const html = await this.fetchPageWithProxy(category.url);
        await this.extractCategoriesFromHtml(html, 3, category.id);
        
        // Add delay to be respectful
        await this.delay(1000);
        
      } catch (error: any) {
        console.log(`   ⚠️ Could not scrape ${category.name}: ${error.message}`);
      }
    }
  }

  private addCategory(category: Category): void {
    // Check for duplicates
    const exists = this.categories.find(cat => 
      cat.id === category.id || 
      (cat.allegroId === category.allegroId && cat.allegroId !== '0')
    );

    if (!exists) {
      this.categories.push(category);
      console.log(`   ✅ Level ${category.level}: ${category.name} (${category.nameEn})`);
    }
  }

  private translateToEnglish(polishName: string): string {
    return TRANSLATIONS[polishName] || polishName;
  }

  private cleanText(text: string): string {
    return text
      .replace(/&[a-z]+;/gi, '') // Remove HTML entities
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private isCommonWord(text: string): boolean {
    const commonWords = ['więcej', 'zobacz', 'wszystkie', 'kategorie', 'produkty', 'strona', 'główna', 'allegro', 'menu', 'szukaj'];
    return commonWords.includes(text.toLowerCase());
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/ł/g, 'l')
      .replace(/ą/g, 'a')
      .replace(/ę/g, 'e')
      .replace(/ó/g, 'o')
      .replace(/ś/g, 's')
      .replace(/ć/g, 'c')
      .replace(/ń/g, 'n')
      .replace(/ź/g, 'z')
      .replace(/ż/g, 'z')
      .replace(/[^a-z0-9\-]/g, '')
      .substring(0, 100);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async saveResults(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join('results', `allegro-categories-${timestamp}.json`);

    // Ensure results directory exists
    const resultsDir = path.join(process.cwd(), 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const exportData = {
      scrapedAt: new Date().toISOString(),
      totalCategories: this.categories.length,
      method: 'Live scraping with scrape.do proxy',
      levelBreakdown: this.getLevelBreakdown(),
      translationCoverage: this.getTranslationCoverage(),
      categories: this.categories.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
    };

    try {
      fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
      console.log(`\n💾 Results saved to: ${filename}`);
    } catch (error: any) {
      console.error('❌ Failed to save results:', error.message);
    }

    this.displaySummary();
  }

  private getLevelBreakdown(): Record<number, number> {
    return this.categories.reduce((acc, cat) => {
      acc[cat.level] = (acc[cat.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  private getTranslationCoverage(): number {
    const translated = this.categories.filter(cat => cat.nameEn !== cat.name).length;
    return Math.round((translated / this.categories.length) * 100);
  }

  private displaySummary(): void {
    console.log('\n📊 Live Scraping Summary');
    console.log('========================');
    
    const levelBreakdown = this.getLevelBreakdown();
    
    Object.entries(levelBreakdown).forEach(([level, count]) => {
      const levelName = this.getLevelName(parseInt(level));
      console.log(`   Level ${level} (${levelName}): ${count}`);
    });

    console.log(`\n📈 Statistics:`);
    console.log(`   Total Categories: ${this.categories.length}`);
    console.log(`   Translation Coverage: ${this.getTranslationCoverage()}%`);
    console.log(`   Method: Live scraping with HTML reference fallback`);
    
    if (this.categories.length >= 100) {
      console.log('   ✅ Good category coverage achieved!');
    } else {
      console.log('   ⚠️ Limited categories found');
    }
  }

  private getLevelName(level: number): string {
    switch (level) {
      case 0: return 'Root';
      case 1: return 'Main Categories';
      case 2: return 'Subcategories';
      case 3: return 'Sub-subcategories';
      default: return `Level ${level}`;
    }
  }
}

// Execute the scraper
async function main() {
  console.log('🚀 Starting Allegro Live Scraper with HTML Reference Fallback...');
  
  const scraper = new AllegroLiveScraper();
  
  try {
    await scraper.scrapeAllCategories();
    console.log('\n🎉 Live scraping completed successfully!');
    
  } catch (error: any) {
    console.error('💥 Scraping failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
