import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    ElasticsearchModule,
    TypeOrmModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
