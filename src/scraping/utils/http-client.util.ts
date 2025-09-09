import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ScrapingConfig } from '../interfaces/scraping.interface';

/**
 * HTTP client wrapper for scraping with proxy support
 */
@Injectable()
export class ScrapingHttpClient {
  private readonly logger = new Logger(ScrapingHttpClient.name);
  private readonly config: ScrapingConfig;

  constructor(config: ScrapingConfig) {
    this.config = config;
  }

  /**
   * Make HTTP request with proxy and retry logic
   */
  async get(url: string, options: any = {}): Promise<any> {
    const proxyUrl = `http://api.scrape.do?token=${this.config.proxyToken}&url=${encodeURIComponent(url)}`;
    
    const requestConfig = {
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...options.headers,
      },
      timeout: 30000,
      maxRedirects: 5,
      ...options,
    };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.logger.debug(`Fetching ${url} (attempt ${attempt}/${this.config.maxRetries})`);
        
        const response = await axios.get(proxyUrl, requestConfig);
        
        if (response.status === 200 && response.data) {
          return response;
        }
        
        throw new Error(`Invalid response: ${response.status}`);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Attempt ${attempt} failed for ${url}: ${error.message}`);
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.requestDelay * attempt; // Exponential backoff
          this.logger.debug(`Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw new Error(`Failed to fetch ${url} after ${this.config.maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
