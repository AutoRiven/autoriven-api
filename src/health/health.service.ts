import { Injectable, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    @Optional() private readonly elasticsearchService?: ElasticsearchService,
  ) {}

  async getHealth() {
    const dbHealth = await this.getDatabaseHealth();
    const esHealth = await this.getElasticsearchHealth();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
      elasticsearch: esHealth,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  async getDatabaseHealth() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'healthy',
        message: 'Database connection is working',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error.message,
      };
    }
  }

  async getElasticsearchHealth() {
    try {
      if (!this.elasticsearchService) {
        return {
          status: 'unavailable',
          message: 'Elasticsearch service not available',
        };
      }
      
      const health = await this.elasticsearchService.cluster.health();
      return {
        status: 'healthy',
        cluster_status: health.status,
        message: 'Elasticsearch is working',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Elasticsearch connection failed',
        error: error.message,
      };
    }
  }
}
