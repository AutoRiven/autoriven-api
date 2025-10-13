import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ScrapingConfig } from '../scraping/interfaces/scraping.interface';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as https from 'https';
import * as http from 'http';

const BROWSER_USER_AGENTS: readonly string[] = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.112 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Safari/537.36 Edg/125.0.2535.79',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.141 Safari/537.36'
];

/**
 * HTTP client wrapper for scraping with scrape.do proxy support
 */
@Injectable()
export class ScrapingHttpClient {
  private readonly logger = new Logger(ScrapingHttpClient.name);
  private readonly config: ScrapingConfig;
  private readonly proxyTokens: string[];
  private proxyRotationIndex = 0;
  private readonly httpsAgent: https.Agent;
  private readonly httpAgent: http.Agent;
  private readonly superProxyHost: string;
  private readonly superProxyPort: number;
  private readonly superProxyPassword: string;
  private readonly sessionClients = new Map<string, AxiosInstance>();
  private readonly sessionJars = new Map<string, CookieJar>();

  constructor(config: ScrapingConfig) {
    this.config = config;
    this.proxyTokens = (config.proxyTokens && config.proxyTokens.length > 0)
      ? config.proxyTokens
      : (config.proxyToken ? [config.proxyToken] : []);
    this.superProxyHost = config.superProxyHost ?? 'proxy.scrape.do';
    this.superProxyPort = config.superProxyPort ?? 8080;
    this.superProxyPassword = config.superProxyPassword ?? 'super=true';
    this.httpsAgent = new https.Agent({
      keepAlive: true,
      rejectUnauthorized: false,
    });
    this.httpAgent = new http.Agent({
      keepAlive: true,
    });
  }

  /**
   * Make HTTP request using scrape.do proxy with proper authentication
   */
  async get(url: string, options: any = {}): Promise<any> {
    const {
      headers: customHeaders = {},
      timeout: customTimeout,
      maxRedirects: customMaxRedirects,
      validateStatus: customValidateStatus,
      proxyToken: customProxyToken,
      sessionKey = 'default',
      ...restOptions
    } = options;

    const effectiveSessionKey = this.normalizeSessionKey(sessionKey);

    const baseConfig: AxiosRequestConfig = {
      method: 'GET',
      url,
      timeout: customTimeout ?? this.config.requestTimeout ?? 45000,
      maxRedirects: customMaxRedirects ?? 10,
      validateStatus: customValidateStatus ?? ((status) => status >= 200 && status < 400),
      responseType: 'text',
      decompress: true,
      transitional: { forcedJSONParsing: false },
      withCredentials: true,
      httpsAgent: this.httpsAgent,
      httpAgent: this.httpAgent,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      ...restOptions,
    };

    let lastError: Error;
    let previousUserAgent: string | undefined;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const { client, jar } = this.getSessionClient(effectiveSessionKey);
        const userAgent = this.resolveUserAgent(customHeaders);
        const headers = this.buildDefaultHeaders(userAgent, customHeaders);
        const proxyToken = this.resolveProxyToken(customProxyToken);
        const requestConfig: AxiosRequestConfig = {
          ...baseConfig,
          headers,
          proxy: {
            protocol: 'http',
            host: this.superProxyHost,
            port: this.superProxyPort,
            auth: {
              username: proxyToken,
              password: this.superProxyPassword,
            },
          },
        };
        (requestConfig as any).jar = jar;

        this.logger.debug(`🌐 Fetching ${url} via scrape.do proxy (attempt ${attempt}/${this.config.maxRetries})`);
        if (attempt === 1 || userAgent !== previousUserAgent) {
          this.logger.debug(`🕵️ Using User-Agent: ${userAgent}`);
        }
        this.logger.debug(`🔑 Using proxy credentials: ${proxyToken ? 'Token selected' : 'No token'}`);
        previousUserAgent = userAgent;
        
  const response = await client.request(requestConfig);
        
        if (response.status === 200 && response.data) {
          const dataLength = typeof response.data === 'string' ? response.data.length : JSON.stringify(response.data).length;
          this.logger.log(`✅ Successfully fetched ${url} (${dataLength} characters)`);
          return response.data;
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

        if (this.shouldResetSession(error)) {
          this.logger.debug('🔄 Resetting session cookies due to proxy response');
          this.resetSession(effectiveSessionKey);
        }
        
        if (attempt < this.config.maxRetries) {
          const delay = this.computeRequestDelay(attempt);
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
    const {
      headers: customHeaders = {},
      timeout: customTimeout,
      maxRedirects: customMaxRedirects,
      validateStatus: customValidateStatus,
      proxyToken: customProxyToken,
      sessionKey = 'default',
      ...restOptions
    } = options;

    const effectiveSessionKey = this.normalizeSessionKey(sessionKey);

    const baseConfig: AxiosRequestConfig = {
      method: 'POST',
      url,
      timeout: customTimeout ?? this.config.requestTimeout ?? 60000,
      maxRedirects: customMaxRedirects ?? 10,
      validateStatus: customValidateStatus ?? ((status) => status >= 200 && status < 400),
      data: JSON.stringify(data),
      responseType: 'text',
      decompress: true,
      transitional: { forcedJSONParsing: false },
      withCredentials: true,
      httpsAgent: this.httpsAgent,
      httpAgent: this.httpAgent,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      ...restOptions,
    };

    let lastError: Error;
    let previousUserAgent: string | undefined;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const { client, jar } = this.getSessionClient(effectiveSessionKey);
        const userAgent = this.resolveUserAgent(customHeaders);
        const headers = this.buildDefaultHeaders(userAgent, {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          ...customHeaders,
        });
        const proxyToken = this.resolveProxyToken(customProxyToken);
        const requestConfig: AxiosRequestConfig = {
          ...baseConfig,
          headers,
          proxy: {
            protocol: 'http',
            host: this.superProxyHost,
            port: this.superProxyPort,
            auth: {
              username: proxyToken,
              password: this.superProxyPassword,
            },
          },
        };
        (requestConfig as any).jar = jar;

        this.logger.debug(`🌐 POST ${url} via scrape.do proxy (attempt ${attempt}/${this.config.maxRetries})`);
        if (attempt === 1 || userAgent !== previousUserAgent) {
          this.logger.debug(`🕵️ Using User-Agent: ${userAgent}`);
        }
        this.logger.debug(`🔑 Using proxy credentials: ${proxyToken ? 'Token selected' : 'No token'}`);
        previousUserAgent = userAgent;
        
        const response = await client.request(requestConfig);
        
        if (response.status >= 200 && response.status < 300 && response.data) {
          this.logger.log(`✅ Successfully posted to ${url}`);
          return response.data;
        }
        
        throw new Error(`Invalid response: ${response.status} - ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`❌ POST attempt ${attempt} failed for ${url}: ${error.message}`);
        
        if (this.shouldResetSession(error)) {
          this.logger.debug('🔄 Resetting session cookies due to proxy response');
          this.resetSession(effectiveSessionKey);
        }

        if (attempt < this.config.maxRetries) {
          const delay = this.computeRequestDelay(attempt);
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

  /**
   * Resolve the user-agent header using overrides, config value, or realistic fallbacks
   */
  private resolveUserAgent(customHeaders: Record<string, any>): string {
    if (customHeaders) {
      const override = Object.entries(customHeaders).find(([key]) => key.toLowerCase() === 'user-agent');
      if (override && typeof override[1] === 'string' && override[1].trim().length > 0) {
        return override[1];
      }
    }

    if (this.config.userAgent && this.config.userAgent.trim().length > 0) {
      return this.config.userAgent;
    }

    const randomIndex = Math.floor(Math.random() * BROWSER_USER_AGENTS.length);
    return BROWSER_USER_AGENTS[randomIndex];
  }

  /**
   * Build browser-like default headers including client hints when appropriate
   */
  private buildDefaultHeaders(userAgent: string, customHeaders: Record<string, any>): Record<string, any> {
    const defaultHeaders: Record<string, any> = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': this.resolveFetchSite(customHeaders),
      'Sec-Fetch-User': '?1',
    };

    const clientHintHeaders = this.buildClientHintHeaders(userAgent, customHeaders);

    return {
      ...defaultHeaders,
      ...clientHintHeaders,
      ...customHeaders,
    };
  }

  private buildClientHintHeaders(userAgent: string, customHeaders: Record<string, any>): Record<string, any> {
    const hasClientHintOverride = Object.keys(customHeaders || {}).some((key) => key.toLowerCase().startsWith('sec-ch-ua'));
    if (hasClientHintOverride) {
      return {};
    }

    if (userAgent.includes('Firefox') || (userAgent.includes('Safari') && !userAgent.includes('Chrome'))) {
      // Firefox and pure Safari do not send sec-ch headers
      return {};
    }

    const platform = this.detectPlatformFromUserAgent(userAgent);
    const brands = this.resolveSecChBrand(userAgent);

    return {
      'Sec-CH-UA': brands,
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': platform,
    };
  }

  private detectPlatformFromUserAgent(userAgent: string): string {
    if (userAgent.includes('Windows')) {
      return '"Windows"';
    }
    if (userAgent.includes('Mac OS X') || userAgent.includes('Macintosh')) {
      return '"macOS"';
    }
    if (userAgent.includes('Linux') || userAgent.includes('X11')) {
      return '"Linux"';
    }
    return '"Unknown"';
  }

  private resolveSecChBrand(userAgent: string): string {
    if (userAgent.includes('Edg/')) {
      return '"Chromium";v="125", "Not.A/Brand";v="24", "Microsoft Edge";v="125"';
    }
    if (userAgent.includes('Chrome/')) {
      return '"Not.A/Brand";v="24", "Chromium";v="125", "Google Chrome";v="125"';
    }

    return '"Not.A/Brand";v="24", "Chromium";v="125"';
  }

  private resolveFetchSite(customHeaders: Record<string, any>): string {
    if (!customHeaders) {
      return 'none';
    }

    const refererHeader = Object.entries(customHeaders).find(([key]) => key.toLowerCase() === 'referer');
    if (!refererHeader) {
      return 'none';
    }

    try {
      const refererUrl = new URL(refererHeader[1]);
      // If referer is an Allegro URL we treat it as same-origin navigation
      if (refererUrl.hostname.endsWith('allegro.pl')) {
        return 'same-origin';
      }
    } catch (error) {
      return 'none';
    }

    return 'cross-site';
  }

  private resolveProxyToken(customProxyToken?: string): string {
    if (customProxyToken && customProxyToken.trim().length > 0) {
      return customProxyToken.trim();
    }

    if (this.proxyTokens.length === 0) {
      throw new Error('No proxy tokens configured for scraping requests');
    }

    const token = this.proxyTokens[this.proxyRotationIndex % this.proxyTokens.length];
    this.proxyRotationIndex++;
    return token;
  }

  private computeRequestDelay(attempt: number): number {
    const baseDelay = this.config.requestDelay * Math.pow(2, attempt - 1);
    const jitterMax = this.config.requestDelayJitter ?? Math.min(this.config.requestDelay, 2000);
    const jitter = Math.random() * jitterMax;
    return Math.round(baseDelay + jitter);
  }

  private getSessionClient(sessionKey: string): { client: AxiosInstance; jar: CookieJar } {
    if (!this.sessionClients.has(sessionKey) || !this.sessionJars.has(sessionKey)) {
      const jar = new CookieJar(undefined, { looseMode: true });
      const instance = wrapper(axios.create({
        withCredentials: true,
        responseType: 'text',
        decompress: true,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        proxy: false,
      }));
      this.sessionClients.set(sessionKey, instance);
      this.sessionJars.set(sessionKey, jar);
    }

    return {
      client: this.sessionClients.get(sessionKey)!,
      jar: this.sessionJars.get(sessionKey)!,
    };
  }

  private resetSession(sessionKey: string): void {
    this.sessionClients.delete(sessionKey);
    this.sessionJars.delete(sessionKey);
  }

  private shouldResetSession(error: any): boolean {
    if (!error) {
      return false;
    }

    const status = (error as AxiosError)?.response?.status;
    return status === 401 || status === 403 || status === 429 || status === 430 || status === 431 || status === 502 || status === 503 || status === 504;
  }

  private normalizeSessionKey(sessionKey: string): string {
    if (this.config.sessionIsolation && sessionKey === 'default') {
      return `session-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
    }

    return sessionKey;
  }
}
