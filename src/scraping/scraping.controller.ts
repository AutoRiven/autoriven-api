import {
  Controller,
  Get,
  Post,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('scraping')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRATOR)
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

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

  @Get('results/latest')
  async getLatestResults() {
    // This would return the latest scraping results from database or file
    return {
      message: 'Check the results directory for latest scraping data',
      endpoint: '/scraping/categories',
    };
  }
}
