# Product Page Scraping - Complete Details Extraction

## Overview

The product scraper **always** visits individual product pages to extract complete product details. The collection/listing pages are only used to get the list of product URLs, then each product page is visited for comprehensive data extraction including:
- Full gallery images
- Complete description HTML with formatting
- EAN/GTIN codes
- Seller information and ratings
- Comprehensive specifications
- Brand and manufacturer details
- **Translated conditions** (Polish → English)

All text fields are automatically translated to English where possible.

## How It Works

### Two-Phase Scraping Process

1. **Phase 1: URL Collection (from listing pages)**
   - Parse category listing pages
   - Extract product URLs from each listing
   - Fast and lightweight (only extracts links)

2. **Phase 2: Data Extraction (from individual product pages)**
   - Visit each product's individual page
   - Extract complete details using comprehensive HTML parsing
   - Save products with full information to database in real-time

This approach ensures:
- ✅ Complete product data (not just basic listing info)
- ✅ All fields populated (gallery, descriptions, specifications, etc.)
- ✅ Consistent data quality
- ✅ Better English translation coverage

## Features

### 1. Mandatory Individual Product Page Visits

The scraper **always** visits individual product pages:
1. Parse listing pages to get product URLs
2. Visit each product's page sequentially
3. Extract complete details from product page HTML
4. Save products with full information to database

### 2. English Translation

All fields are translated to English including:
- **Product names** via `translateCategory()`
- **Conditions** via `translateCondition()` (New, Used, Damaged, Refurbished)
- Polish terms automatically converted to English equivalents

### 3. JSON Export for Translation Reference

Use the `--json` flag to save scraping results to JSON files for:
- Translation reference
- Data analysis
- Debugging
- External processing

## Usage

### Command Line Script

```bash
# Scrape with JSON export for translation reference
npm run scrape:products -- --max=10 --json

# Scrape from specific category
npm run scrape:products -- --category=abc-123-def --max=50

# Scrape with JSON export
npm run scrape:products -- --max=5 --json

# Scrape specific category with full details
npm run scrape:products -- --category=abc-123-def --max=50 --json
```

### REST API Endpoints

```bash
# Scrape all products with JSON export
POST /scraping/products/all?maxProducts=10&saveJson=true

# Scrape specific category
POST /scraping/products/category/:categoryId?maxProducts=50

# Scrape with JSON export only
POST /scraping/products/all?maxProducts=20&saveJson=true
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxProducts` | number | unlimited | Maximum number of products to scrape |
| `saveJson` | boolean | false | Save results to JSON file in `results/` folder |

**Note:** Product page visiting is now **mandatory** and not an option.

## Condition Translation

The scraper automatically translates Polish condition terms to English:

| Polish | English |
|--------|---------|
| Nowy, Nowe, Nowa | New |
| Używany, Używane, Używana | Used |
| Uszkodzony, Uszkodzone, Uszkodzona | Damaged |
| Odnowiony, Odnowione, Odnowiona | Refurbished |
| Po regeneracji | Refurbished |

## Complete Product Fields

When visiting product pages, the following fields are extracted:

### Basic Information
- `name` - Product name (Polish)
- `nameEn` - Product name (English translation)
- `allegroId` - Allegro offer ID
- `autoRivenId` - AutoRiven unique ID
- `price` - Price in PLN
- `condition` - Condition (English: New, Used, etc.)

### Images & Media
- `images` - First 3 images (for compatibility)
- `galleryImages` - Complete image gallery (all images)

### Product Details
- `description` - Plain text description
- `descriptionHtml` - HTML description with formatting
- `brand` - Product brand
- `manufacturer` - Manufacturer name
- `ean` - EAN/GTIN barcode
- `specifications` - Key-value pairs of product specs

### Seller Information
- `sellerName` - Seller's display name
- `sellerRating` - Seller rating (0-5 scale)

### Availability
- `inStock` - Stock status
- `freeDelivery` - Free delivery available

### URLs & Slugs
- `allegroUrl` - Original Allegro product URL
- `englishUrl` - AutoRiven English product URL
- `slug` - Polish URL slug
- `englishSlug` - English URL slug

## Real-Time Database Saving

Products are automatically saved to PostgreSQL database in real-time:
- Saved immediately after each page is scraped
- Existing products are **updated** (not duplicated) using `allegroId` check
- No batch saving at the end
- Better monitoring and data persistence

## JSON File Format

When `saveJson: true`, results are saved to `results/products-{timestamp}.json`:

```json
{
  "scrapedAt": "2025-01-15T10:30:00.000Z",
  "totalProducts": 25,
  "method": "Comprehensive scraping from all database categories",
  "products": [
    {
      "allegroId": "123456789",
      "autoRivenId": "AR10001",
      "name": "Filtr oleju do BMW E46",
      "nameEn": "Oil Filter for BMW E46",
      "condition": "New",
      "price": 45.99,
      "currency": "PLN",
      "brand": "Bosch",
      "manufacturer": "Bosch",
      "ean": "4047024567890",
      "galleryImages": ["url1", "url2", "url3"],
      "descriptionHtml": "<div>Product description...</div>",
      "sellerName": "AutoParts24",
      "sellerRating": 4.92,
      "specifications": {
        "Height": "123 mm",
        "Diameter": "76 mm"
      }
    }
  ]
}
```

## Performance Considerations

### Scraping Speed

- **URL Collection**: Fast (~2 seconds per page of 60 products)
- **Data Extraction**: Moderate (~1.5 seconds per product)
- **Overall Speed**: Depends on number of products (60 products ≈ 2-3 minutes)

### Why Visit Individual Pages?

**Benefits:**
- ✅ Complete product information (all fields populated)
- ✅ Better data quality (structured HTML from product pages)
- ✅ More reliable parsing (consistent page structure)
- ✅ Full gallery images, descriptions, specifications
- ✅ Seller ratings and detailed attributes

**Trade-off:**
- ⏱️ Slower scraping (but ensures data completeness)
- 🔄 More HTTP requests (mitigated with delays to avoid rate limiting)

### Recommendations

1. **For testing**: Use `--max=5` to test functionality quickly
2. **For production**: Let it run without limits for complete catalog
3. **For translation work**: Use `--json` to export data for translation scripts
4. **For monitoring**: Real-time database saving allows you to monitor progress

## Examples

### Example 1: Test Complete Scraping
```bash
# Scrape 5 products with JSON export
npm run scrape:products -- --max=5 --json
```

### Example 2: Scrape Specific Category
```bash
# Get category ID from database first
npm run scrape:products -- --category=abc-123-def --max=20
```

### Example 3: Export for Translation
```bash
# Scrape and export JSON for translation reference
npm run scrape:products -- --max=50 --json
```

### Example 4: Production Scraping
```bash
# Scrape all products (will take time!)
npm run scrape:products -- --json
```

## Update Logic

The scraper checks if products already exist in the database:
- **Check**: Searches for existing product by `allegroId` or `autoRivenId`
- **Update**: If found, updates all fields with latest data
- **Insert**: If not found, creates new product record
- **No Duplicates**: Same product won't be created twice

This ensures:
- Fresh data on re-scraping
- No duplicate products
- Price updates are captured
- Stock status is current

## Translation Coverage

### Fully Translated
✅ Product names (via category translation)
✅ Conditions (Nowy → New, Używany → Used, etc.)
✅ English slugs for URLs
✅ Category names

### Partially Translated
⚠️ Product descriptions (kept in Polish, HTML preserved)
⚠️ Specifications (keys and values in Polish)
⚠️ Manufacturer names (kept as-is)

### Future Enhancements
- Add description translation via external API
- Translate specification keys
- Add more condition variations

## Troubleshooting

### Products Not Saving
- Check database connection in `.env`
- Verify real-time saving is enabled (default)
- Check logs for database errors

### Slow Scraping
- This is expected behavior (~1.5s per product page)
- Required to get complete product data
- Delays prevent rate limiting and ensure stability
- Reduce `--max` value for faster testing

### Incomplete Data
- All fields should be populated from product pages
- If fields are missing, check product page HTML structure
- Review logs for parsing errors
- Some products may have missing optional fields (EAN, brand, etc.)

### Translation Issues
- Ensure `translations.util.ts` has latest mappings
- Check console logs for untranslated terms
- Add new terms to `CONDITION_TRANSLATIONS` or `CATEGORY_TRANSLATIONS`

## Files Modified

1. `src/scraping/interfaces/scraping.interface.ts` - Added flags
2. `src/scraping/product-scraping.service.ts` - Enhanced parsing & JSON export
3. `src/scraping/scraping.controller.ts` - Updated endpoints
4. `src/common/translations.util.ts` - Added condition translations
5. `scripts/scrape-products.ts` - Added CLI flags

## Related Documentation

- [REAL_TIME_SCRAPING.md](./REAL_TIME_SCRAPING.md) - Real-time database saving
- [README.md](./README.md) - General project documentation
