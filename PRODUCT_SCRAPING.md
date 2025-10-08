# Product Scraping System

This document describes the comprehensive product scraping system for AutoRiven API.

## Overview

The product scraping system allows you to scrape automotive products from Allegro.pl and save them to the PostgreSQL database. It includes:

- **Database-driven scraping**: Uses scraped categories from the database
- **Flexible options**: Scrape all products, specific category, or single product
- **AutoRiven IDs**: Assigns unique 5-digit IDs (starting from 10000)
- **English translations**: Generates English slugs and URLs
- **REST API endpoints**: Full API support for scraping operations
- **CLI scripts**: Command-line tools for batch operations

## Features

### 1. Product Entity Fields

```typescript
- allegroId: string          // Allegro offer ID
- autoRivenId: number        // Unique AutoRiven ID (10000+)
- name: string               // Polish product name
- nameEn: string             // English product name
- slug: string               // Polish URL slug
- englishSlug: string        // English URL slug
- allegroUrl: string         // Original Allegro URL
- englishUrl: string         // AutoRiven product URL
- price: number              // Product price
- currency: string           // Currency (PLN)
- description: string        // Product description
- brand: string              // Product brand
- images: string[]           // Product images
- specifications: object     // Product specifications
- categoryId: UUID           // Main category ID
- subcategoryId: UUID        // Subcategory ID
- inStock: boolean           // Availability status
```

### 2. Scraping Methods

#### A. Scrape All Products
Scrapes products from all categories in the database:

```bash
# CLI
npm run scrape:products -- --max=10 --save

# API
POST /scraping/products/all?maxPerCategory=10
```

#### B. Scrape by Category
Scrapes products from a specific category:

```bash
# CLI
npm run scrape:products -- --category=abc-123-def --max=50 --save

# API
POST /scraping/products/category/:categoryId?categoryId=abc-123-def&maxProducts=50
```

#### C. Scrape by Offer ID
Scrapes a single product using Allegro offer ID:

```bash
# CLI
npm run scrape:products -- --offer=123456789 --save

# API
POST /scraping/products/offer/:offerId?offerId=123456789
```

## CLI Usage

### Installation
No additional installation needed - scripts use existing dependencies.

### Commands

#### Help
```bash
npm run scrape:products:help
```

#### Scrape All Products (Limited)
```bash
# Scrape max 10 products per category and save to database
npm run scrape:products -- --max=10 --save

# Just scrape without saving (results to JSON only)
npm run scrape:products -- --max=20
```

#### Scrape Specific Category
```bash
# Get category ID from database first
# Then scrape that category
npm run scrape:products -- --category=YOUR_CATEGORY_ID --max=100 --save
```

#### Scrape Single Product
```bash
# Using Allegro offer ID (from product URL)
npm run scrape:products -- --offer=123456789 --save
```

### CLI Options

| Option | Description | Required |
|--------|-------------|----------|
| `--category=<id>` | Scrape specific category by UUID | No |
| `--offer=<id>` | Scrape specific product by Allegro offer ID | No |
| `--max=<number>` | Maximum products to scrape | No |
| `--save` | Save to database (otherwise JSON only) | No |

## API Endpoints

All endpoints require JWT authentication and ADMINISTRATOR role.

### 1. Scrape All Products
```http
POST /scraping/products/all?maxPerCategory=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Product scraping completed successfully",
  "data": {
    "totalProducts": 250,
    "scrapedAt": "2024-10-08T10:30:00.000Z"
  }
}
```

### 2. Scrape Products by Category
```http
POST /scraping/products/category/:categoryId?categoryId=abc-123&maxProducts=50
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Products scraped from category: Filtry powietrza",
  "data": {
    "categoryName": "Filtry powietrza",
    "categoryId": "abc-123",
    "totalProducts": 50,
    "scrapedAt": "2024-10-08T10:30:00.000Z"
  }
}
```

### 3. Scrape Product by Offer ID
```http
POST /scraping/products/offer/:offerId?offerId=123456789
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Product scraped successfully: Filtr powietrza K&N",
  "data": {
    "allegroId": "123456789",
    "autoRivenId": 10001,
    "name": "Filtr powietrza K&N",
    "nameEn": "Air filter K&N",
    "slug": "filtr-powietrza-k-n",
    "englishSlug": "air-filter-k-n",
    "allegroUrl": "https://allegro.pl/oferta/123456789",
    "englishUrl": "https://autoriven.com/product/air-filter-k-n-10001",
    "price": 149.99,
    "currency": "PLN",
    "images": ["..."],
    "inStock": true
  }
}
```

### 4. Save Products to Database
```http
POST /scraping/products/save-to-db
Authorization: Bearer <token>
Content-Type: application/json

{
  "products": [...]
}
```

### 5. Scrape Category and Save (Combined)
```http
POST /scraping/products/category/:categoryId/save?categoryId=abc-123&maxProducts=50
Authorization: Bearer <token>
```

## Product Scraping Service

### Service Methods

```typescript
class ProductScrapingService {
  // Scrape all products from all categories
  async scrapeAllProducts(options?: {
    maxProductsPerCategory?: number
  }): Promise<ProductScrapingResult>

  // Scrape products from specific category
  async scrapeProductsByCategory(
    categoryId: string,
    maxProducts?: number
  ): Promise<ProductScrapingResult>

  // Scrape single product by offer ID
  async scrapeProductByOfferId(
    offerId: string
  ): Promise<ScrapedProduct>

  // Save products to database
  async saveProductsToDatabase(
    products: ScrapedProduct[]
  ): Promise<void>
}
```

## AutoRiven ID System

### Product IDs
- **Range**: 10000 - 99999
- **Format**: 5-digit sequential numbers
- **Unique**: Database constraint ensures uniqueness
- **Usage**: Used in English URLs and product identification

### Examples
```
Product 1: 10000 → https://autoriven.com/product/air-filter-10000
Product 2: 10001 → https://autoriven.com/product/brake-pads-10001
Product 3: 10002 → https://autoriven.com/product/oil-filter-10002
```

## Database Schema

### Migration
```sql
-- Add product fields
ALTER TABLE products ADD COLUMN nameEn varchar NULL;
ALTER TABLE products ADD COLUMN autoRivenId integer NULL;
ALTER TABLE products ADD COLUMN englishSlug varchar NULL;
ALTER TABLE products ADD COLUMN englishUrl varchar NULL;

-- Create unique index
CREATE UNIQUE INDEX IDX_products_autoRivenId 
ON products (autoRivenId) 
WHERE autoRivenId IS NOT NULL;
```

## Output Files

All scraping results are saved to the `results/` directory:

```
results/
├── allegro-products-2024-10-08T10-30-00-000Z.json
├── allegro-products-2024-10-08T11-15-00-000Z.json
└── ...
```

### File Format
```json
{
  "scrapedAt": "2024-10-08T10:30:00.000Z",
  "totalProducts": 250,
  "categoryName": "Filtry powietrza",
  "categoryId": "abc-123",
  "method": "Scraping from specific category: Filtry powietrza",
  "products": [
    {
      "allegroId": "123456789",
      "autoRivenId": 10001,
      "name": "Filtr powietrza K&N",
      "nameEn": "Air filter K&N",
      "slug": "filtr-powietrza-k-n",
      "englishSlug": "air-filter-k-n",
      "allegroUrl": "https://allegro.pl/oferta/123456789",
      "englishUrl": "https://autoriven.com/product/air-filter-k-n-10001",
      "price": 149.99,
      "currency": "PLN",
      "images": ["..."],
      "inStock": true
    }
  ]
}
```

## Workflow Example

### Complete Product Scraping Workflow

1. **First, ensure categories are in database:**
   ```bash
   npm run save:categories
   ```

2. **Find category to scrape:**
   Query database or use API to get category IDs

3. **Scrape products from category:**
   ```bash
   npm run scrape:products -- --category=YOUR_CATEGORY_ID --max=100 --save
   ```

4. **Verify in database:**
   ```sql
   SELECT COUNT(*) FROM products;
   SELECT * FROM products ORDER BY "createdAt" DESC LIMIT 10;
   ```

## Error Handling

The scraper includes comprehensive error handling:

- **Network errors**: Automatic retry with exponential backoff
- **Parsing errors**: Logged but don't stop the scraping process
- **Database errors**: Transactions ensure data consistency
- **Rate limiting**: Built-in delays between requests

## Performance Considerations

### Rate Limiting
- 2-second delay between product pages
- 3-second delay between categories
- Configurable via `ScrapingConfig`

### Memory Management
- Products saved in batches
- Results streamed to files
- Database transactions for consistency

### Scalability
- Can handle thousands of products
- Incremental scraping support
- Duplicate detection by `allegroId` and `autoRivenId`

## Monitoring

### Logs
```
🛍️ Starting comprehensive product scraping...
🔍 Scraping products from: Filtry powietrza
📄 Fetching page 1
✅ Found 30 products on page 1
📄 Fetching page 2
✅ Found 28 products on page 2
💾 Saving 58 products to database...
✅ Saved new product: Filtr powietrza K&N
📦 New products: 58
✨ Process completed successfully!
```

## Troubleshooting

### Common Issues

1. **No products found**
   - Check if category has `hasProducts: true`
   - Verify Allegro URL is accessible
   - Check HTML selectors are up to date

2. **Duplicate key errors**
   - Products with same `autoRivenId` already exist
   - Check ID counter is properly initialized

3. **Network timeouts**
   - Increase `requestDelay` in config
   - Check proxy/VPN configuration

## Future Enhancements

- [ ] Incremental updates (only scrape new/changed products)
- [ ] Image download and storage
- [ ] Product review scraping
- [ ] Price history tracking
- [ ] Automatic category detection
- [ ] Multi-language support
- [ ] Parallel scraping with rate limiting

## Related Documentation

- [Category Scraping](./CATEGORY_SCRAPING.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [API Documentation](./API.md)
