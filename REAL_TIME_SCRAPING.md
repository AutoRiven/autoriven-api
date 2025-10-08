# Real-Time Product Scraping

## Overview
The product scraper now saves products to the PostgreSQL database **in real-time** as they are scraped, rather than waiting until the end of the scraping process. This provides immediate visibility into scraping progress and ensures data is persisted continuously.

## Key Changes

### 1. Real-Time Database Saving
- Products are saved to the database **immediately after each page is scraped**
- No waiting until the end of the entire scraping process
- Progress is visible in real-time through database queries

### 2. Removed JSON File Output
- Removed `saveProductResults()` method
- No longer creates JSON files in the `results/` folder
- Products are saved **only** to the PostgreSQL database

### 3. Enhanced Logging
Products are saved immediately after parsing each page, with concise logging:
```
💾 Saved 73 products from page 1 to database
✅ Database: +65 new, ~8 updated
```

### 4. Method Signatures Updated

#### `scrapeAllProducts(options)`
- Returns `ProductScrapingResult` with `products: []` (empty since already saved)
- Logs total count: `Total products: 1234`

#### `scrapeProductsByCategory(categoryId, maxProducts)`
- Returns `ProductScrapingResult` with `products: []` (empty since already saved)
- Saves products in real-time as each page is scraped

#### `scrapeProductsFromCategory()` (private)
- Added `saveRealTime: boolean = false` parameter
- When `true`, saves products after each page
- When `false`, returns products without saving (for testing)

## Usage

### Run Scraper with Database Saving
```bash
# Scrape all categories, save products in real-time
npm run scrape:products

# Scrape with limit (max 5 products per category), save in real-time
npm run scrape:products -- --max=5

# Scrape specific category by ID, save in real-time
npm run scrape:products -- --category=<category-id>
```

### Monitor Progress in Real-Time

**Option 1: Query Database (Recommended)**
```sql
-- Count total products
SELECT COUNT(*) FROM products;

-- View recently scraped products
SELECT name, price, "lastScrapedAt" 
FROM products 
ORDER BY "lastScrapedAt" DESC 
LIMIT 20;

-- Count by category
SELECT c.name, COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p."categoryId" = c.id
GROUP BY c.name
ORDER BY product_count DESC;
```

**Option 2: Watch Logs**
```bash
# Real-time logs show:
# - Each page being fetched
# - Products parsed from each page
# - Database save results (+new, ~updated)
# - Running total of products scraped
```

## Database Schema
Products are saved with all enhanced fields:
- **Basic Info**: name, price, description
- **Images**: `images` (first 3), `galleryImages` (full gallery)
- **Description**: `description` (plain text), `descriptionHtml` (formatted HTML)
- **Product Details**: `ean`, `brand`, `manufacturer`, `condition`
- **Seller Info**: `sellerName`, `sellerRating`
- **Metadata**: `lastScrapedAt`, `isActive`, `inStock`

## Benefits

### ✅ Real-Time Visibility
- Query database at any time to see scraped products
- No waiting for scraping to finish
- Monitor progress and verify data immediately

### ✅ Data Persistence
- Products saved immediately (not lost if process crashes)
- Can stop/restart scraping without losing data
- Database serves as single source of truth

### ✅ Memory Efficiency
- Products not held in memory
- Reduced memory footprint for large scraping jobs
- Better performance for long-running scrapes

### ✅ Easier Debugging
- Check database to see exactly what was scraped
- Identify issues with specific categories immediately
- No need to parse large JSON files

## Example Log Output

```
[Nest] 12528  - 10/08/2025, 3:52:15 PM     LOG [ProductScrapingService] 🔍 Scraping products from: Silniki i osprzęt (https://allegro.pl/kategoria/czesci-samochodowe-silniki-i-osprzet-50821)
[Nest] 12528  - 10/08/2025, 3:52:15 PM   DEBUG [ProductScrapingService] 📄 Fetching page 1: https://allegro.pl/kategoria/czesci-samochodowe-silniki-i-osprzet-50821
[Nest] 12528  - 10/08/2025, 3:52:27 PM     LOG [ScrapingHttpClient] ✅ Successfully fetched (4522408 characters)
[Nest] 12528  - 10/08/2025, 3:52:27 PM   DEBUG [ProductScrapingService] Found product listing container
[Nest] 12528  - 10/08/2025, 3:52:27 PM   DEBUG [ProductScrapingService] Found 73 article elements
[Nest] 12528  - 10/08/2025, 3:52:27 PM     LOG [ProductScrapingService] 📦 Parsed 73 products from page
[Nest] 12528  - 10/08/2025, 3:52:27 PM   DEBUG [ProductScrapingService] 💾 Saved 73 products from page 1 to database
[Nest] 12528  - 10/08/2025, 3:52:27 PM     LOG [ProductScrapingService] ✅ Database: +65 new, ~8 updated
[Nest] 12528  - 10/08/2025, 3:52:27 PM   DEBUG [ProductScrapingService] ✅ Found 73 products on page 1
[Nest] 12528  - 10/08/2025, 3:52:29 PM   DEBUG [ProductScrapingService] 📄 Fetching page 2...
```

## Migration Notes

### From JSON Files to Database
If you have existing JSON files in `results/`, you can:
1. **Ignore them** - New scrapes save directly to database
2. **Import them** - Use the test script to load historical data:
   ```bash
   npm run test:scrape -- --category=<id> --max=5 --save
   ```

### Monitoring Changes
- **Before**: Check JSON files in `results/` folder
- **After**: Query PostgreSQL database directly

## Technical Details

### Database Operations
- Uses TypeORM repository pattern
- Checks for existing products by `allegroId` or `autoRivenId`
- Updates existing products or inserts new ones
- Sets `lastScrapedAt` timestamp on every save

### Performance
- Batch size: Products from each page (typically 73 products)
- Saves occur after each page fetch (every ~10-30 seconds)
- Database transactions ensure data consistency
- Minimal memory usage (products not accumulated)

### Error Handling
- Individual product save errors are logged but don't stop scraping
- Page fetch errors are caught and logged
- Scraping continues to next page/category on errors
- Error counts shown in summary logs

## Troubleshooting

### Products Not Appearing in Database
1. Check logs for database save errors
2. Verify database connection in `.env`
3. Ensure migrations have been run: `npm run migration:run`

### Slow Scraping
- This is normal - includes delays to avoid rate limiting
- Each page takes ~10-30 seconds to fetch and save
- Categories have 3-second delays between them

### Duplicate Products
- Products are deduplicated by `allegroId`
- Re-running scraper updates existing products
- Use `lastScrapedAt` to identify recently updated products
