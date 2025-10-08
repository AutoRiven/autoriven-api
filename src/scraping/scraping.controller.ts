import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ProductScrapingService } from './product-scraping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('scraping')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRATOR)
export class ScrapingController {
  constructor(
    private readonly scrapingService: ScrapingService,
    private readonly productScrapingService: ProductScrapingService,
  ) {}

  @Get('health')
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'scraping',
    };
  }

  @Post('categories')
  async scrapeCategories() {
    try {
      const result = await this.scrapingService.scrapeAllCategories();
      return {
        success: true,
        message: 'Category scraping completed successfully',
        data: {
          totalCategories: result.totalCategories,
          levelBreakdown: result.levelBreakdown,
          scrapedAt: result.scrapedAt,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Category scraping failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('categories/save-to-db')
  async saveCategoriesFromLatestScrape() {
    try {
      // First scrape categories
      const result = await this.scrapingService.scrapeAllCategories();
      
      // Then save to database
      const saveResult = await this.scrapingService.saveCategoriesToDatabase(result.categories);
      
      return {
        success: true,
        message: 'Categories scraped and saved to database successfully',
        data: {
          scraping: {
            totalCategories: result.totalCategories,
            levelBreakdown: result.levelBreakdown,
            scrapedAt: result.scrapedAt,
          },
          database: {
            savedCategories: saveResult.savedCategories,
            savedSubcategories: saveResult.savedSubcategories,
            errors: saveResult.errors,
          },
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to scrape and save categories',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('categories/save-existing')
  async saveCategoriesFromFile() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Find the latest results file
      const resultsDir = path.join(process.cwd(), 'results');
      const files = fs.readdirSync(resultsDir)
        .filter(file => file.startsWith('allegro-categories-') && file.endsWith('.json'))
        .sort()
        .reverse();
      
      if (files.length === 0) {
        throw new Error('No scraping results found. Please run scraping first.');
      }
      
      const latestFile = path.join(resultsDir, files[0]);
      const fileContent = fs.readFileSync(latestFile, 'utf-8');
      const data = JSON.parse(fileContent);
      
      // Save to database
      const saveResult = await this.scrapingService.saveCategoriesToDatabase(data.categories);
      
      return {
        success: true,
        message: 'Categories saved to database from existing file',
        data: {
          sourceFile: files[0],
          totalCategories: data.totalCategories,
          database: {
            savedCategories: saveResult.savedCategories,
            savedSubcategories: saveResult.savedSubcategories,
            errors: saveResult.errors,
          },
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to save categories from file',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('results/latest')
  async getLatestResults() {
    // This would return the latest scraping results from database or file
    return {
      message: 'Check the results directory for latest scraping data',
      endpoint: '/scraping/categories',
    };
  }

  // ========== PRODUCT SCRAPING ENDPOINTS ==========

  @Post('products/all')
  async scrapeAllProducts(
    @Query('maxProducts') maxProducts?: number,
    @Query('saveJson') saveJson?: string,
  ) {
    try {
      const result = await this.productScrapingService.scrapeAllProducts({
        maxProducts: maxProducts ? parseInt(maxProducts as any) : undefined,
        saveJson: saveJson === 'true',
      });
      
      return {
        success: true,
        message: 'Product scraping completed successfully',
        data: {
          totalProducts: result.totalProducts,
          scrapedAt: result.scrapedAt,
          savedJson: saveJson === 'true',
          note: 'All data scraped from individual product pages',
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Product scraping failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('products/category/:categoryId')
  async scrapeProductsByCategory(
    @Query('categoryId') categoryId: string,
    @Query('maxProducts') maxProducts?: number,
    @Query('saveJson') saveJson?: string,
  ) {
    try {
      if (!categoryId) {
        throw new Error('Category ID is required');
      }

      const result = await this.productScrapingService.scrapeProductsByCategory(
        categoryId,
        {
          maxProducts: maxProducts ? parseInt(maxProducts as any) : undefined,
          saveJson: saveJson === 'true',
        },
      );
      
      return {
        success: true,
        message: `Products scraped from category: ${result.categoryName}`,
        data: {
          categoryName: result.categoryName,
          categoryId: result.categoryId,
          totalProducts: result.totalProducts,
          scrapedAt: result.scrapedAt,
          savedJson: saveJson === 'true',
          note: 'All data scraped from individual product pages',
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to scrape products from category',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('products/offer/:offerId')
  async scrapeProductByOfferId(@Query('offerId') offerId: string) {
    try {
      if (!offerId) {
        throw new Error('Offer ID is required');
      }

      const product = await this.productScrapingService.scrapeProductByOfferId(offerId);
      
      return {
        success: true,
        message: `Product scraped successfully: ${product.name}`,
        data: product,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to scrape product',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('products/save-to-db')
  async saveProductsToDatabase(@Body('products') products: any[]) {
    try {
      if (!products || products.length === 0) {
        throw new Error('No products provided to save');
      }

      await this.productScrapingService.saveProductsToDatabase(products);
      
      return {
        success: true,
        message: 'Products saved to database successfully',
        data: {
          savedCount: products.length,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to save products to database',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('products/category/:categoryId/save')
  async scrapeCategoryAndSave(
    @Query('categoryId') categoryId: string,
    @Query('maxProducts') maxProducts?: number,
    @Query('saveJson') saveJson?: string,
  ) {
    try {
      if (!categoryId) {
        throw new Error('Category ID is required');
      }

      // Scrape products
      const result = await this.productScrapingService.scrapeProductsByCategory(
        categoryId,
        {
          maxProducts: maxProducts ? parseInt(maxProducts as any) : undefined,
          saveJson: saveJson === 'true',
        },
      );
      
      // Note: Products are already saved to database in real-time
      
      return {
        success: true,
        message: `Products scraped and saved from category: ${result.categoryName}`,
        data: {
          categoryName: result.categoryName,
          categoryId: result.categoryId,
          totalProducts: result.totalProducts,
          scrapedAt: result.scrapedAt,
          savedJson: saveJson === 'true',
          note: 'All data scraped from individual product pages',
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to scrape and save products',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
