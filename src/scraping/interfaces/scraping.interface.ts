/**
 * Category interface for Allegro.pl scraping
 */
export interface Category {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  englishSlug: string;
  url: string;
  englishUrl: string;
  autoRivenId: number;
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
  proxyTokens?: string[];
  baseUrl: string;
  userAgent?: string;
  requestDelay: number;
  requestDelayJitter?: number;
  maxRetries: number;
  requestTimeout?: number;
  productPageTimeout?: number;
  productRequestDelay?: number;
  productRequestDelayJitter?: number;
  productRetryBackoffFactor?: number;
  superProxyHost?: string;
  superProxyPort?: number;
  superProxyPassword?: string;
  sessionIsolation?: boolean;
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

/**
 * Product interface for Allegro.pl scraping
 */
export interface ScrapedProduct {
  allegroId: string;
  autoRivenId: number;
  name: string;
  nameEn: string;
  slug: string;
  englishSlug: string;
  allegroUrl: string;
  englishUrl: string;
  price: number;
  currency: string;
  description?: string;
  descriptionHtml?: string;
  brand?: string;
  model?: string; // Product model extracted from description or parameters
  year?: number; // Year of manufacture/production
  condition?: string;
  seller?: string;
  images: string[];
  galleryImages?: string[];
  specifications?: Record<string, any>;
  categoryId?: string;
  subcategoryId?: string;
  inStock: boolean;
  manufacturer?: string | null;
  partNumber?: string | null;
  ean?: string | null;
  rating?: number;
  reviewCount?: number;
  freeDelivery?: boolean;
  sellerName?: string | null;
  sellerRating?: number | null;
}

/**
 * Product scraping result interface
 */
export interface ProductScrapingResult {
  scrapedAt: string;
  totalProducts: number;
  categoryName?: string;
  categoryId?: string;
  method: string;
  products: ScrapedProduct[];
}

/**
 * Product scraping options
 */
export interface ProductScrapingOptions {
  categoryId?: string;
  subcategoryId?: string;
  allegroOfferId?: string;
  maxProducts?: number;
  startPage?: number;
  saveJson?: boolean; // Flag to save JSON files for translation reference (all data now comes from individual product pages)
}
