import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapingService } from './scraping.service';
import { ScrapingController } from './scraping.controller';
import { Category } from '../products/entities/category.entity';
import { Subcategory } from '../products/entities/subcategory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Subcategory]),
  ],
  controllers: [ScrapingController],
  providers: [ScrapingService],
  exports: [ScrapingService],
})
export class ScrapingModule {}
