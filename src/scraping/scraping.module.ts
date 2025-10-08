import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapingService } from './scraping.service';
import { ProductScrapingService } from './product-scraping.service';
import { ScrapingController } from './scraping.controller';
import { Category } from '../products/entities/category.entity';
import { Subcategory } from '../products/entities/subcategory.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Subcategory, Product]),
  ],
  controllers: [ScrapingController],
  providers: [ScrapingService, ProductScrapingService],
  exports: [ScrapingService, ProductScrapingService],
})
export class ScrapingModule {}
