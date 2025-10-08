# Product Scraper Update - October 2025

## Overview
The product scraper has been completely reworked to match the current Allegro.pl HTML structure as of October 2025. This update ensures accurate and reliable product data extraction.

## What Changed

### 1. HTML Structure Analysis
- **Container**: Products are now within `[data-role="itemsContainer"]`
- **Product Elements**: Each product is an `<article>` tag (not `article[data-role="offer"]`)
- **Title**: Located in `<h2><a>` structure
- **URLs**: May include event tracking redirects that need to be decoded
- **Images**: Multiple images in a `<ul>` list with carousel structure
- **Price**: Located in `<p[aria-label*="aktualna cena"]>` with complex span nesting

### 2. New Fields Extracted
The scraper now extracts additional product information:

- ✅ **Manufacturer**: From product attributes (Producent części)
- ✅ **Condition**: Product condition (Stan - Nowy, Używany, etc.)
- ✅ **Part Number**: Catalog number (Numer katalogowy części)
- ✅ **Rating**: Product rating (e.g., 4.56 out of 5)
- ✅ **Review Count**: Number of customer reviews
- ✅ **Free Delivery**: Boolean flag for free shipping

### 3. Enhanced Image Extraction
- Extracts all images from product carousel (not just the first one)
- Converts image URLs to highest quality (`/original/` instead of `/s360/`)
- Removes duplicate images

### 4. URL Parsing Improvements
- Handles event tracking URLs (`/events/clicks?...&redirect=...`)
- Properly decodes URL-encoded redirect parameters
- Correctly extracts offer ID from various URL formats

### 5. Database Schema Updates
New columns added to `products` table:
```sql
ALTER TABLE products ADD COLUMN manufacturer varchar;
ALTER TABLE products ADD COLUMN condition varchar;
ALTER TABLE products ADD COLUMN rating decimal(3,2);
ALTER TABLE products ADD COLUMN reviewCount integer DEFAULT 0;
ALTER TABLE products ADD COLUMN freeDelivery boolean DEFAULT false;
```

## Migration Applied
```
Migration: AddProductScrapingFields1728290000000
Status: ✅ Successfully executed
Columns Added: 5 (manufacturer, condition, rating, reviewCount, freeDelivery)
```

## Updated Files

### Core Service
- `src/scraping/product-scraping.service.ts`
  - Rewrote `parseProductListings()` method
  - Updated `saveProductsToDatabase()` to include new fields
  - Enhanced error handling and logging

### Entity Updates
- `src/products/entities/product.entity.ts`
  - Added 5 new columns with proper TypeORM decorators

### Interface Updates
- `src/scraping/interfaces/scraping.interface.ts`
  - Extended `ScrapedProduct` interface with new optional fields

### Database Migration
- `src/database/migrations/1728290000000-AddProductScrapingFields.ts`
  - New migration for schema changes

### Test Scripts
- `scripts/test-updated-scraper.ts`
  - Comprehensive test script for new scraper functionality

## Testing

### Run the Updated Scraper Test
```bash
npm run test:updated-scraper
```

This will:
1. ✅ Scrape 5 products from automotive categories
2. ✅ Display detailed product information including new fields
3. ✅ Save products to database
4. ✅ Verify all fields are properly extracted and saved

### Expected Output
```
📦 Product: VEVOR Ogrzewanie postojowe Nagrzewnica 12V2KW
   AutoRiven ID: 10001
   Allegro ID: 16470296664
   Price: 369.99 PLN
   Condition: Nowy
   Manufacturer: Vevor
   Part Number: 840349928319
   Rating: 4.56/5
   Reviews: 43
   Free Delivery: Yes
   Images: 16 images
   English Name: VEVOR Parking Heater 12V2KW
   English Slug: vevor-parking-heater-12v2kw
   English URL: /product/vevor-parking-heater-12v2kw-10001
```

## API Endpoints
All existing endpoints now return enhanced product data:

### Scrape All Products
```bash
POST /scraping/products/all
Body: { "maxProductsPerCategory": 10 }
```

### Scrape by Category
```bash
POST /scraping/products/category/:categoryId
Body: { "maxProducts": 50 }
```

### Scrape by Offer ID
```bash
POST /scraping/products/offer/:offerId
```

### Save to Database
```bash
POST /scraping/products/save-to-db
Body: { products: [...] }
```

## CLI Scripts

### Scrape Products
```bash
# Scrape 10 products and save to database
npm run scrape:products -- --max=10 --save

# Scrape from specific category
npm run scrape:products -- --category=UUID --max=100 --save

# Scrape specific product
npm run scrape:products -- --offer=16470296664 --save
```

## Key Improvements

### 1. Reliability
- ✅ Matches current Allegro HTML structure exactly
- ✅ Handles both regular and sponsored product listings
- ✅ Gracefully handles missing fields

### 2. Data Quality
- ✅ Extracts all available product images (not just one)
- ✅ Gets highest quality image URLs
- ✅ Parses complex nested price structures
- ✅ Extracts product attributes (condition, manufacturer, etc.)

### 3. Performance
- ✅ Efficient cheerio selectors
- ✅ Batch database operations
- ✅ Proper error handling prevents crashes

### 4. Maintainability
- ✅ Clear, documented code
- ✅ Comprehensive logging
- ✅ Type-safe interfaces
- ✅ Test scripts for verification

## Verification Checklist

Before deploying to production, verify:

- [ ] Migration executed successfully
- [ ] Test script runs without errors
- [ ] Products have all new fields populated
- [ ] Images array contains multiple images
- [ ] Ratings and reviews are correctly parsed
- [ ] Free delivery flag is accurate
- [ ] AutoRiven IDs are sequential (10000+)
- [ ] English translations are generated
- [ ] Database save operations succeed

## Troubleshooting

### Issue: No products scraped
**Solution**: Check if Allegro changed their HTML structure again. Review the HTML in browser dev tools.

### Issue: Images not extracted
**Solution**: Verify image URLs still use `allegroimg.com` domain. Check if carousel structure changed.

### Issue: Price parsing fails
**Solution**: Inspect the price element structure. Update the `aria-label` selector if needed.

### Issue: Offer ID not extracted
**Solution**: Check URL format in browser. Update regex pattern if Allegro changed URL structure.

## Future Enhancements

Potential improvements for next iteration:

1. **Delivery Estimates**: Parse delivery date ranges
2. **Seller Information**: Extract seller name and rating
3. **Product Variations**: Handle size/color variations
4. **Stock Status**: Detect "ostatnie sztuki" (last items) warnings
5. **Price History**: Track price changes over time
6. **Bulk Discounts**: Extract quantity-based pricing

## HTML Reference
Current structure saved in: `src/scraping/html-references/items-container.html`

Update this file whenever Allegro updates their structure to maintain scraper accuracy.

---

**Last Updated**: October 8, 2025
**Allegro Structure Version**: October 2025
**Migration Version**: 1728290000000
