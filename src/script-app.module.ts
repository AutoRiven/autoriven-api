import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScrapingModule } from './scraping/scraping.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Only include scraping module for scripts
    ScrapingModule,
  ],
})
export class ScriptAppModule {}
