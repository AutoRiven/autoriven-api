import AppDataSource from '../data-source';
import { Category } from '../../products/entities/category.entity';
import { Subcategory } from '../../products/entities/subcategory.entity';
import * as fs from 'fs';
import * as path from 'path';

interface ScrapedCategory {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  url: string;
  level: number;
  parentId?: string;
  hasProducts: boolean;
  productCount: number;
}

export class CategorySeeder {
  async run() {
    try {
      // Initialize database connection
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }

      const categoryRepository = AppDataSource.getRepository(Category);
      const subcategoryRepository = AppDataSource.getRepository(Subcategory);

      // Read scraped categories from results file
      const resultsPath = path.join(__dirname, '../../../results');
      const files = fs.readdirSync(resultsPath);
      const categoriesFile = files.find(file => file.includes('allegro-categories') && file.endsWith('.json'));
      
      if (!categoriesFile) {
        console.error('Categories file not found. Please run the scraper first.');
        return;
      }

      const fullPath = path.join(resultsPath, categoriesFile);
      const rawData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const scrapedData: ScrapedCategory[] = rawData.categories || rawData;
      console.log(`Found ${scrapedData.length} categories to import`);

      // Separate main categories (level 0) and subcategories (level 1)
      const mainCategories = scrapedData.filter(cat => cat.level === 0);
      const subCategories = scrapedData.filter(cat => cat.level === 1);

      console.log(`Main categories: ${mainCategories.length}, Subcategories: ${subCategories.length}`);

      // Insert main categories first
      const categoryMap = new Map<string, string>(); // allegroId -> uuid mapping

      for (const catData of mainCategories) {
        const existingCategory = await categoryRepository.findOne({
          where: { allegroId: catData.id }
        });

        if (!existingCategory) {
          const category = categoryRepository.create({
            name: catData.name,
            nameEn: catData.nameEn,
            slug: catData.slug,
            allegroId: catData.id,
            allegroUrl: catData.url,
            level: catData.level,
            hasProducts: catData.hasProducts,
            productCount: catData.productCount,
            isActive: true,
          });

          const saved = await categoryRepository.save(category);
          categoryMap.set(catData.id, saved.id);
          console.log(`✅ Created category: ${catData.name}`);
        } else {
          categoryMap.set(catData.id, existingCategory.id);
          console.log(`⚠️  Category already exists: ${catData.name}`);
        }
      }

      // Insert subcategories
      for (const subCatData of subCategories) {
        const existingSubcategory = await subcategoryRepository.findOne({
          where: { allegroId: subCatData.id }
        });

        if (!existingSubcategory && subCatData.parentId) {
          const parentCategoryId = categoryMap.get(subCatData.parentId);
          
          if (parentCategoryId) {
            const subcategory = subcategoryRepository.create({
              name: subCatData.name,
              nameEn: subCatData.nameEn,
              slug: subCatData.slug,
              allegroId: subCatData.id,
              allegroUrl: subCatData.url,
              level: subCatData.level,
              hasProducts: subCatData.hasProducts,
              productCount: subCatData.productCount,
              categoryId: parentCategoryId,
              isActive: true,
            });

            await subcategoryRepository.save(subcategory);
            console.log(`✅ Created subcategory: ${subCatData.name}`);
          } else {
            console.log(`⚠️  Parent category not found for subcategory: ${subCatData.name}`);
          }
        } else if (existingSubcategory) {
          console.log(`⚠️  Subcategory already exists: ${subCatData.name}`);
        }
      }

      console.log('🎉 Category seeding completed successfully!');

      // Update category counts
      const categories = await categoryRepository.find({ relations: ['subcategories'] });
      for (const category of categories) {
        const subcategoryCount = category.subcategories.length;
        if (subcategoryCount > 0) {
          category.productCount = category.subcategories.reduce((sum, sub) => sum + (sub as any).productCount, 0);
          await categoryRepository.save(category);
        }
      }

      console.log('📊 Updated category product counts');

    } catch (error) {
      console.error('❌ Error seeding categories:', error);
    } finally {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
    }
  }
}

// Run seeder if called directly
if (require.main === module) {
  const seeder = new CategorySeeder();
  seeder.run();
}
