# Product Scraping Architecture

## Overview

The AutoRiven product scraper uses a **two-phase approach** to ensure complete and accurate product data extraction from Allegro.pl.

## Architecture

### Phase 1: URL Collection (Listing Pages)
```
Category Listing Page
  ↓
Parse HTML → Extract Product URLs
  ↓
Store URLs in memory
```

**Purpose**: Quickly gather all product URLs from category pages  
**Speed**: ~2 seconds per page of 60 products  
**Data Extracted**: Only product URLs

### Phase 2: Data Extraction (Individual Product Pages)
```
For each Product URL:
  ↓
Visit Individual Product Page
  ↓
Parse Complete HTML → Extract All Fields
  ↓
Translate to English (conditions, categories)
  ↓
Save to Database (real-time)
```

**Purpose**: Get complete, detailed product information  
**Speed**: ~1.5 seconds per product  
**Data Extracted**: All product fields (images, specs, seller info, etc.)

## Why Two Phases?

### Previous Approach (Single Phase - Listing Pages Only)
❌ Limited data (only basic fields from listings)  
❌ Missing gallery images  
❌ No product descriptions  
❌ No seller information  
❌ No detailed specifications  

### Current Approach (Two Phases - Listing + Product Pages)
✅ Complete product data  
✅ Full gallery images  
✅ HTML descriptions with formatting  
✅ Seller names and ratings  
✅ Comprehensive specifications  
✅ EAN codes, brands, manufacturers  
✅ Better translation coverage  

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SCRAPING WORKFLOW                         │
└─────────────────────────────────────────────────────────────┘

1. START: Category URL
   │
   ├─► Parse Listing Page (Phase 1)
   │   └─► Extract Product URLs [url1, url2, url3, ...]
   │
2. FOR EACH URL (Phase 2):
   │
   ├─► HTTP GET → Individual Product Page
   │
   ├─► Parse Product Page HTML:
   │   ├─ Name, Price, Condition
   │   ├─ Gallery Images (all)
   │   ├─ Description HTML
   │   ├─ Specifications
   │   ├─ Brand, Manufacturer, EAN
   │   └─ Seller Info (name, rating)
   │
   ├─► Translate to English:
   │   ├─ Condition (translateCondition)
   │   └─ Product Name (translateCategory)
   │
   ├─► Create AutoRiven IDs & Slugs
   │
   └─► Save to PostgreSQL (real-time)
       ├─ Check if exists (by allegroId)
       ├─ UPDATE if found
       └─ INSERT if new

3. OPTIONAL: Export to JSON (if --json flag)

4. END: Products saved to database
```

## Key Methods

### `parseProductUrls(html: string): string[]`
- Extracts product URLs from listing pages
- Fast and lightweight
- Returns array of product URLs

### `parseProductDetails(html: string, productUrl: string, categoryId?: string): ScrapedProduct`
- Parses individual product page HTML
- Extracts all product fields
- Applies translations
- Returns complete product object

### `scrapeProductsFromCategory(categoryUrl, categoryId, maxProducts?, saveRealTime?)`
- Main orchestrator method
- Combines both phases
- Handles pagination
- Manages delays and rate limiting

## Translation System

### Condition Translation
```typescript
CONDITION_TRANSLATIONS = {
  'Nowy': 'New',
  'Nowe': 'New',
  'Nowa': 'New',
  'Używany': 'Used',
  'Używane': 'Used',
  'Używana': 'Used',
  'Uszkodzony': 'Damaged',
  'Odnowiony': 'Refurbished',
  // ... includes gender variations
}
```

### Category Translation
- Uses existing `CATEGORY_TRANSLATIONS` map
- Applies to product names
- Creates English slugs for URLs

## Real-Time Database Saving

### Update Logic
```typescript
1. Query database for existing product:
   - Search by allegroId (primary)
   - Or by autoRivenId (fallback)

2. If product exists:
   → UPDATE all fields with latest data
   → Preserve ID and created_at
   → Update last_scraped_at

3. If product doesn't exist:
   → INSERT new product
   → Generate new autoRivenId
   → Set created_at and last_scraped_at
```

### Benefits
- ✅ No duplicate products
- ✅ Fresh data on re-scraping
- ✅ Price updates captured
- ✅ Stock status current
- ✅ Real-time monitoring

## Performance Metrics

### Per Category Page (60 products)
- Phase 1 (URL Collection): **~2 seconds**
- Phase 2 (Data Extraction): **~90 seconds** (60 × 1.5s)
- **Total**: ~92 seconds per page

### Delays
- Between product pages: **1.5 seconds**
- Between listing pages: **2 seconds**
- Purpose: Prevent rate limiting, ensure stability

### Scalability
- **100 products**: ~2.5 minutes
- **1000 products**: ~25 minutes
- **10000 products**: ~4 hours

## Error Handling

### URL Extraction Errors
- Log warning, continue to next article
- Gracefully handle missing elements

### Product Page Errors
- Log warning with URL
- Skip failed product, continue with next
- Don't fail entire scraping job

### Database Errors
- Log error with product details
- Continue with next product
- Track error count

## JSON Export (Optional)

When `--json` flag is used:
```json
{
  "scrapedAt": "2025-10-08T10:30:00.000Z",
  "totalProducts": 50,
  "method": "Comprehensive scraping",
  "products": [
    {
      "allegroId": "123456789",
      "name": "Filtr oleju",
      "nameEn": "Oil Filter",
      "condition": "New",
      "price": 45.99,
      "galleryImages": [...],
      "descriptionHtml": "...",
      "sellerName": "AutoParts24",
      "sellerRating": 4.92,
      "specifications": {...}
    }
  ]
}
```

**Saved to**: `results/products-{timestamp}.json`

## Code Files

### Core Service
- `src/scraping/product-scraping.service.ts`
  - `parseProductUrls()` - Phase 1
  - `parseProductDetails()` - Phase 2
  - `scrapeProductsFromCategory()` - Orchestrator
  - `saveProductsToDatabase()` - Real-time saving
  - `saveProductResultsToJson()` - Optional export

### Interfaces
- `src/scraping/interfaces/scraping.interface.ts`
  - `ScrapedProduct` - Product data structure
  - `ProductScrapingOptions` - Scraping configuration
  - `ProductScrapingResult` - Scraping output

### Translations
- `src/common/translations.util.ts`
  - `CONDITION_TRANSLATIONS` - Polish → English conditions
  - `CATEGORY_TRANSLATIONS` - Polish → English categories
  - `translateCondition()` - Translation function
  - `translateCategory()` - Translation function

### Controller
- `src/scraping/scraping.controller.ts`
  - REST API endpoints
  - Query parameter handling

### Scripts
- `scripts/scrape-products.ts` - CLI interface
- `scripts/test-updated-scraper.ts` - Testing

## Future Enhancements

### Potential Improvements
- [ ] Parallel product page fetching (with concurrency limit)
- [ ] Resume functionality (continue from last scraped product)
- [ ] Progress bar for CLI
- [ ] Description translation via external API
- [ ] Specification key translation
- [ ] Product categorization ML model
- [ ] Image analysis for condition verification

### Monitoring
- [ ] Scraping metrics dashboard
- [ ] Error rate tracking
- [ ] Performance analytics
- [ ] Rate limiting alerts

## Related Documentation

- [PRODUCT_PAGE_SCRAPING.md](./PRODUCT_PAGE_SCRAPING.md) - User guide and examples
- [REAL_TIME_SCRAPING.md](./REAL_TIME_SCRAPING.md) - Real-time saving details
- [README.md](./README.md) - General project documentation
