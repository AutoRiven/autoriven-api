import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ScrapingService, ScrapingResult, AllegroCategory, AllegroProduct } from './scraping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BatchScrapeDto } from './dto/scraping.dto';

@Controller('scraping')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRATOR)
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Get('health')
  async getHealth() {
    return this.scrapingService.healthCheck();
  }

  @Get('categories')
  async getCategories(): Promise<ScrapingResult<AllegroCategory[]>> {
    try {
      const categories = await this.scrapingService.scrapeCategories();
      return {
        success: true,
        data: categories,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  @Get('categories/:categoryUrl/subcategories')
  async getSubcategories(
    @Param('categoryUrl') categoryUrl: string,
  ): Promise<ScrapingResult<AllegroCategory[]>> {
    try {
      // Decode the URL parameter
      const decodedUrl = decodeURIComponent(categoryUrl);
      return await this.scrapingService.scrapeSubcategories(decodedUrl);
    } catch (error) {
      throw new HttpException(
        'Failed to scrape subcategories',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('products')
  async getProducts(
    @Query('categoryUrl') categoryUrl?: string,
    @Query('limit') limit?: string,
  ): Promise<ScrapingResult<AllegroProduct[]>> {
    try {
      if (!categoryUrl) {
        throw new HttpException(
          'Category URL is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const decodedUrl = decodeURIComponent(categoryUrl);
      const productLimit = limit ? parseInt(limit, 10) : 50;

      return await this.scrapingService.scrapeProducts(decodedUrl, productLimit);
    } catch (error) {
      throw new HttpException(
        'Failed to scrape products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('search')
  async searchProducts(
    @Query('q') query?: string,
    @Query('limit') limit?: string,
  ): Promise<ScrapingResult<AllegroProduct[]>> {
    try {
      if (!query) {
        throw new HttpException(
          'Search query is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const productLimit = limit ? parseInt(limit, 10) : 50;
      return await this.scrapingService.searchProducts(query, productLimit);
    } catch (error) {
      throw new HttpException(
        'Failed to search products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('product/:productUrl')
  async getProductDetails(
    @Param('productUrl') productUrl: string,
  ): Promise<ScrapingResult<AllegroProduct>> {
    try {
      const decodedUrl = decodeURIComponent(productUrl);
      return await this.scrapingService.scrapeProductDetails(decodedUrl);
    } catch (error) {
      throw new HttpException(
        'Failed to scrape product details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('batch-scrape')
  async batchScrape(@Body() request: BatchScrapeDto) {
    try {
      const results = {
        categories: [] as any[],
        products: [] as any[],
        searches: [] as any[],
        timestamp: new Date(),
      };

      const limit = request.limit || 50;

      // Scrape multiple categories
      if (request.categories && request.categories.length > 0) {
        for (const categoryUrl of request.categories) {
          try {
            const categoryResult = await this.scrapingService.scrapeProducts(
              categoryUrl,
              limit,
            );
            results.categories.push({
              categoryUrl,
              result: categoryResult,
            });
          } catch (error) {
            results.categories.push({
              categoryUrl,
              result: {
                success: false,
                error: error.message,
                timestamp: new Date(),
              },
            });
          }
        }
      }

      // Scrape individual products
      if (request.products && request.products.length > 0) {
        for (const productUrl of request.products) {
          try {
            const productResult = await this.scrapingService.scrapeProductDetails(
              productUrl,
            );
            results.products.push({
              productUrl,
              result: productResult,
            });
          } catch (error) {
            results.products.push({
              productUrl,
              result: {
                success: false,
                error: error.message,
                timestamp: new Date(),
              },
            });
          }
        }
      }

      // Perform multiple searches
      if (request.searchQueries && request.searchQueries.length > 0) {
        for (const query of request.searchQueries) {
          try {
            const searchResult = await this.scrapingService.searchProducts(
              query,
              limit,
            );
            results.searches.push({
              query,
              result: searchResult,
            });
          } catch (error) {
            results.searches.push({
              query,
              result: {
                success: false,
                error: error.message,
                timestamp: new Date(),
              },
            });
          }
        }
      }

      return {
        success: true,
        data: results,
        message: 'Batch scraping completed',
      };
    } catch (error) {
      throw new HttpException(
        'Batch scraping failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
