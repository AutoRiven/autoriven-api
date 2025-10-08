# Product Scraping Enhancement Documentation

## Overview

The product scraping system has been enhanced to extract comprehensive product information from Allegro.pl, including high-resolution gallery images, HTML descriptions, EAN codes, and seller information.

## Database Schema Updates

### New Fields Added to `products` Table

The following fields have been added via migration `1728291000000-AddProductEnhancedFields`:

| Field | Type | Description |
|-------|------|-------------|
| `descriptionHtml` | `text` | Full HTML description from product page (preserves formatting, images, and structure) |
| `galleryImages` | `text` | Array of high-resolution gallery image URLs (stored as simple-array) |
| `ean` | `varchar` | EAN/GTIN product code for inventory management |
| `sellerName` | `varchar` | Name of the seller/store |
| `sellerRating` | `decimal(3,2)` | Seller rating on 5-point scale (e.g., 4.96 for 99.2% recommendation) |

### Running the Migration

```bash
npm run migration:run
```

To revert:
```bash
npm run migration:revert
```

## Scraping Architecture

### Two-Phase Scraping Approach

1. **Listing Page Scraping** (`parseProductListings`)
   - Scrapes product listings from category pages
   - Extracts basic information: name, price, thumbnail images, attributes
   - Fast and efficient for bulk product discovery
   - Category association handled via `subcategoryId` parameter

2. **Detail Page Scraping** (`parseProductDetails`)
   - Scrapes individual product pages for complete information
   - Extracts gallery images, full descriptions, EAN codes, seller info
   - Used for comprehensive product data collection

## HTML Selectors Reference

Based on Allegro.pl HTML structure (October 2025):

### Product Listing Page (`items-container.html`)

```typescript
// Product container
'[data-role="itemsContainer"] article'

// Product title and URL
'article h2 a'

// Price
'p[aria-label*="aktualna cena"]'

// Images
'ul img[src*="allegroimg.com"]'

// Attributes (Condition, Manufacturer, etc.)
'dl dt' // Key
'dd'    // Value

// Rating
'[aria-label*="na 5"]'

// Review count
'span.mpof_uk'
```

### Product Detail Page (`item-single.html`)

```typescript
// Product name
'meta[itemprop="name"]'

// Price
'meta[itemprop="price"]'

// Brand
'meta[itemprop="brand"]'

// EAN/GTIN
'meta[itemprop="gtin"]'
// Fallback: Extract from image alt text
'img[alt*="EAN"]' // Format: "EAN (GTIN) 0840349928319"

// Gallery images
'div[data-box-name="showoffer.gallery"] img'
'img[data-srcset]' // Check for original URLs in srcset

// Description HTML
'div[data-box-name="Description"] div[itemprop="description"]'

// Seller name
'div[data-box-name="showoffer.sellerInfoHeader"] div[class*="mp0t_ji"]'
// Format: "od Oficjalny sklep VEVOR"

// Seller rating
'a[data-analytics-click-label="sellerRating"]'
// Format: "poleca 99,2%"

// Condition
'meta[itemprop="itemCondition"]'
// Values: NewCondition, UsedCondition

// Manufacturer (from image alt)
'img[alt*="Producent"]'
// Format: "Producent części Vevor"
```

## Usage Examples

### Scrape Single Product

```typescript
const productScrapingService = app.get(ProductScrapingService);

// Scrape by Allegro offer ID
const product = await productScrapingService.scrapeProductByOfferId('16470296664');

console.log(product.name);              // Product name
console.log(product.galleryImages);     // Array of high-res image URLs
console.log(product.descriptionHtml);   // Full HTML description
console.log(product.ean);               // EAN code
console.log(product.sellerName);        // Seller name
console.log(product.sellerRating);      // Seller rating (0-5)
```

### Scrape Products from Category

```typescript
// Scrape products from a specific category
const result = await productScrapingService.scrapeProductsByCategory(
  'category-id-here',
  10 // Max products to scrape
);

// Save to database
await productScrapingService.saveProductsToDatabase(result.products);
```

### Scrape All Products from All Categories

```typescript
const result = await productScrapingService.scrapeAllProducts({
  maxProductsPerCategory: 50
});
```

## API Endpoints

The scraping service is exposed via REST API:

### Scrape Products from Category

```http
POST /api/scraping/scrape-products/:categoryId
Content-Type: application/json

{
  "maxProducts": 10
}
```

### Scrape Single Product

```http
POST /api/scraping/scrape-product/:offerId
```

## Data Transformations

### Seller Rating Conversion

Allegro displays seller ratings as percentages (e.g., "poleca 99,2%").
We convert this to a 5-point scale:

```typescript
const ratingPercent = 99.2; // From "poleca 99,2%"
const sellerRating = (ratingPercent / 100) * 5; // 4.96
```

### Image URL Optimization

Gallery images are extracted and converted to highest quality:

```typescript
// Original: https://a.allegroimg.com/s512/11e7f4/...
// Converted: https://a.allegroimg.com/original/11e7f4/...

const highQualityUrl = imgSrc.replace(/\/s\d+\//, '/original/');
```

### Description HTML Storage

The `descriptionHtml` field preserves the complete HTML structure, including:
- Text formatting (paragraphs, headings)
- Images embedded in the description
- Tables (specifications)
- Lists

This allows for rich product descriptions on the frontend.

## Testing

Run the test script to validate scraping:

```bash
npm run test:scraping
```

Or manually:

```bash
npx ts-node scripts/test-product-scraping.ts
```

## Error Handling

The scraper includes robust error handling:

1. **Network failures**: Automatic retries via ScrapingHttpClient
2. **Missing elements**: Graceful fallbacks and null checks
3. **Invalid data**: Validation and sanitization
4. **Database errors**: Detailed logging and rollback

## Performance Considerations

1. **Rate Limiting**: 2-3 second delays between requests to avoid blocking
2. **Batch Processing**: Products are saved to database in batches
3. **Image Optimization**: Only high-quality images are stored
4. **HTML Cleanup**: Descriptions are sanitized before storage

## Category Association

Products are associated with categories during scraping:

1. Subcategories are fetched from database with their Allegro URLs
2. Products are scraped from each subcategory URL
3. `subcategoryId` is automatically assigned during scraping
4. Parent `categoryId` can be derived from subcategory relationship

## Future Enhancements

Potential improvements:

1. **Incremental Updates**: Only scrape products that have changed
2. **Price History**: Track price changes over time
3. **Stock Monitoring**: Alert when products come back in stock
4. **Review Scraping**: Extract detailed product reviews
5. **Image Analysis**: Extract product attributes from images using AI

## Troubleshooting

### Common Issues

**Issue**: No gallery images extracted
- **Solution**: Check if Allegro HTML structure has changed. Update selectors in `parseProductDetails`

**Issue**: EAN not found
- **Solution**: EAN might be in image alt text. Check `img[alt*="EAN"]` selector

**Issue**: Seller rating is 0
- **Solution**: Verify seller rating selector. Format: `a[data-analytics-click-label="sellerRating"]`

**Issue**: Description HTML is empty
- **Solution**: Check `div[data-box-name="Description"]` selector

## Migration History

| Migration | Date | Description |
|-----------|------|-------------|
| 1728289000000 | Initial | AutoRiven IDs for products |
| 1728290000000 | Oct 2024 | Manufacturer, condition, rating, reviewCount, freeDelivery |
| 1728291000000 | Oct 2024 | descriptionHtml, galleryImages, ean, sellerName, sellerRating |

## Contact & Support

For issues or questions about the scraping system, please refer to:
- API documentation: `/api/docs`
- Database schema: `src/products/entities/product.entity.ts`
- Scraping service: `src/scraping/product-scraping.service.ts`
