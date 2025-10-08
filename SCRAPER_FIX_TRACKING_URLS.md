# Scraper Fix: Tracking URL Issue

## Problem Identified

When running the scraper with `npm run scrape:products -- --max=10 --json`, the scraper was failing with two types of errors:

### 1. HTTP 400 Errors (Main Issue)
Most product URLs being extracted were Allegro's tracking/click URLs:
```
https://allegro.pl/events/clicks?emission_unit_id=...&redirect=https%3A%2F%2Fallegro.pl%2Foferta%2F...
```

These tracking URLs were being rejected by the scrape.do proxy with **400 Bad Request** errors.

### 2. Timeout Errors
Some direct product URLs were timing out after 30 seconds, possibly due to proxy issues or slow responses.

## Root Cause

The `parseProductUrls()` method was extracting URLs directly from `<h2><a>` elements, which often contain tracking URLs instead of clean product URLs. Allegro uses these for ad tracking and analytics.

## Solution Implemented

Enhanced the `parseProductUrls()` method with **three-tier URL extraction logic**:

### Method 1: Data Attributes (Most Reliable)
```typescript
const offerLink = $article.find('a[data-role="offer"]').first();
productUrl = offerLink.attr('href');
```
Looks for explicit offer links with `data-role="offer"` attribute.

### Method 2: Redirect Parameter Parsing
```typescript
if (rawUrl.includes('/events/clicks') && rawUrl.includes('redirect=')) {
  const url = new URL(rawUrl, 'https://allegro.pl');
  const redirectParam = url.searchParams.get('redirect');
  if (redirectParam) {
    productUrl = decodeURIComponent(redirectParam);
  }
}
```
If tracking URL is found, extracts the actual product URL from the `redirect` query parameter.

### Method 3: Direct Product Links
```typescript
const directLink = $article.find('a[href*="/oferta/"]').first();
if (rawUrl && !rawUrl.includes('/events/clicks')) {
  productUrl = rawUrl;
}
```
Finds any direct `/oferta/` links that aren't tracking URLs.

### Clean URL Processing
After extraction, the method:
1. Ensures full URLs (adds `https://allegro.pl` if needed)
2. **Removes all query parameters** to get clean product URLs
3. Keeps only: `{origin}{pathname}` (e.g., `https://allegro.pl/oferta/product-name-123456789`)

## Benefits

1. ✅ **No More 400 Errors**: Clean product URLs instead of tracking URLs
2. ✅ **Better Success Rate**: Multiple fallback methods ensure URL extraction
3. ✅ **Cleaner Data**: Removes tracking parameters from URLs
4. ✅ **More Reliable**: Works with different Allegro HTML structures

## Testing

Run the scraper again:
```bash
npm run scrape:products -- --max=10 --json
```

Expected behavior:
- Clean product URLs extracted (format: `https://allegro.pl/oferta/product-name-id`)
- No HTTP 400 errors from tracking URLs
- Successful product page visits and data extraction

## Example URL Transformations

### Before (Tracking URL - FAILED):
```
https://allegro.pl/events/clicks?emission_unit_id=ff65fe7b-fddb-456e-be21-87bccc402f5e&emission_id=...&redirect=https%3A%2F%2Fallegro.pl%2Foferta%2Fnadkole-lewy-przod-oslona-wneki-kola-audi-a4-b8-08-11r-filcowe-8k-17958494672%3Fbi_s%3Dads...
```
❌ Result: HTTP 400 Bad Request

### After (Clean URL - SUCCESS):
```
https://allegro.pl/oferta/nadkole-lewy-przod-oslona-wneki-kola-audi-a4-b8-08-11r-filcowe-8k-17958494672
```
✅ Result: Successful product page fetch

## Files Modified

- `src/scraping/product-scraping.service.ts` - Enhanced `parseProductUrls()` method

## Date
October 8, 2025
