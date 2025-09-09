/**
 * Category interface for Allegro.pl scraping
 */
export interface Category {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  url: string;
  level: number;
  parentId: string | null;
  allegroId: string;
  hasProducts: boolean;
  productCount?: number;
}

/**
 * Scraping configuration interface
 */
export interface ScrapingConfig {
  proxyToken: string;
  baseUrl: string;
  userAgent: string;
  requestDelay: number;
  maxRetries: number;
}

/**
 * Scraping result interface
 */
export interface ScrapingResult {
  scrapedAt: string;
  totalCategories: number;
  method: string;
  levelBreakdown: Record<string, number>;
  categories: Category[];
}
