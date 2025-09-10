import axios from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ScrapingConfig } from '../interfaces/scraping.interface';
import * as https from 'https';

/**
 * HTTP client wrapper for scraping with scrape.do proxy support
 */
@Injectable()
export class ScrapingHttpClient {
  private readonly logger = new Logger(ScrapingHttpClient.name);
  private readonly config: ScrapingConfig;

  constructor(config: ScrapingConfig) {
    this.config = config;
  }

  /**
   * Make HTTP request using scrape.do proxy with proper authentication
   */
  async get(url: string, options: any = {}): Promise<any> {
    const requestConfig = {
      method: 'GET',
      url: url,
      proxy: {
        protocol: 'http',
        host: 'proxy.scrape.do',
        port: 8080,
        auth: {
          username: this.config.proxyToken,
          password: 'super=true'
        }
      },
      headers: {
        'User-Agent': this.config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        ...options.headers,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Allow self-signed certificates for proxy
      }),
      timeout: 30000, // Reduced timeout
      maxRedirects: 10,
      validateStatus: (status) => status >= 200 && status < 400,
      ...options,
    };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.logger.debug(`🌐 Fetching ${url} via scrape.do proxy (attempt ${attempt}/${this.config.maxRetries})`);
        this.logger.debug(`🔑 Using proxy credentials: ${this.config.proxyToken ? 'Token provided' : 'No token'}`);
        
        const response = await axios(requestConfig);
        
        if (response.status === 200 && response.data) {
          const dataLength = typeof response.data === 'string' ? response.data.length : JSON.stringify(response.data).length;
          this.logger.log(`✅ Successfully fetched ${url} (${dataLength} characters)`);
          return response;
        }
        
        throw new Error(`Invalid response: ${response.status} - ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`❌ Attempt ${attempt} failed for ${url}: ${error.message}`);
        
        // Log more details for debugging
        if (error.response) {
          this.logger.warn(`Response status: ${error.response.status}`);
          this.logger.warn(`Response headers: ${JSON.stringify(error.response.headers)}`);
        }
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.requestDelay * Math.pow(2, attempt - 1); // Exponential backoff
          this.logger.debug(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw new Error(`Failed to fetch ${url} after ${this.config.maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Make POST request using scrape.do proxy
   */
  async post(url: string, data: any = {}, options: any = {}): Promise<any> {
    const requestConfig = {
      method: 'POST',
      url: url,
      proxy: {
        protocol: 'http',
        host: 'proxy.scrape.do',
        port: 8080,
        auth: {
          username: this.config.proxyToken,
          password: 'super=true'
        }
      },
      headers: {
        'User-Agent': this.config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
        ...options.headers,
      },
      data: JSON.stringify(data),
      timeout: 60000,
      maxRedirects: 10,
      validateStatus: (status) => status >= 200 && status < 400,
      ...options,
    };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.logger.debug(`🌐 POST ${url} via scrape.do proxy (attempt ${attempt}/${this.config.maxRetries})`);
        
        const response = await axios(requestConfig);
        
        if (response.status >= 200 && response.status < 300 && response.data) {
          this.logger.log(`✅ Successfully posted to ${url}`);
          return response;
        }
        
        throw new Error(`Invalid response: ${response.status} - ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`❌ POST attempt ${attempt} failed for ${url}: ${error.message}`);
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.requestDelay * Math.pow(2, attempt - 1);
          this.logger.debug(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw new Error(`Failed to POST ${url} after ${this.config.maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
