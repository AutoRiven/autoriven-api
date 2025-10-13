# Product Scraper Rebuild Summary

## Date: October 9, 2025

## Problem
The user reported that scraped products were missing critical fields:
- Description
- Description HTML  
- Brand
- Model
- Year
- Primary Image
- Gallery Images
- EAN

## Root Cause Analysis

After examining the actual HTML structure in `src/scraping/html-references/item-single.html` (10,499 lines), discovered that:

1. The previous scraper was using incorrect CSS selectors
2. Some fields weren't being extracted at all
3. Image extraction was not using the proper gallery structure
4. Parameters table wasn't being parsed correctly

## HTML Structure Findings

Based on actual Allegro.pl HTML (as of October 2025):

### Product Title
```html
<h1 class="mgn2_21 mgn2_25_s">Diesel Air Heater 12V 2KW...</h1>
```
**Selector**: `h1.mgn2_21`

### Price
```html
<meta itemprop="price" content="369.99">
<meta itemprop="priceCurrency" content="PLN">
```
**Selector**: `meta[itemprop="price"]` attribute `content`

### Brand
```html
<meta itemprop="brand" content="Vevor">
```
**Selector**: `meta[itemprop="brand"]` attribute `content`
**Line in HTML**: 9670

### Gallery Images
Thumbnails are in s128 size:
```html
<button ...>
  <img class="msub_80 m9tr_5r _07951_IOf8s"
       src="https://a.allegroimg.com/s128/11e7f4/74f004494e90b4c0db82113f0b15/..."
       alt="Diesel Air Heater...">
</button>
```
**Selector**: `button img[src*="allegroimg.com/s128/"]`
**Conversion**: Replace `/s128/` with `/original/` to get full-size images

### Description
```html
<div data-box-name="Description" ...>
  <div class="..." itemprop="description">
    <!-- HTML content with formatting and images -->
    <div class="mgn2_16 _0d3bd_am0a-">
      <p>Nagrzewnica powietrza 2kW Diesel</p>
      <p>Zachowaj ciepło...</p>
      ...
    </div>
  </div>
</div>
```
**Selector**: `div[itemprop="description"]`
- **HTML**: Use `.html()` to get formatted content with images
- **Plain Text**: Use `.text()` for description field

### Parameters Table
```html
<div data-box-name="Parameters" ...>
  <table class="...">
    <tbody>
      <tr>
        <td class="...">Stan</td>
        <td class="...">Nowy</td>
      </tr>
      <tr>
        <td class="...">Producent części</td>
        <td class="...">Vevor</td>
      </tr>
      <tr>
        <td class="...">Numer katalogowy części</td>
        <td class="...">840349928319</td>
      </tr>
      ...
    </tbody>
  </table>
</div>
```
**Selector**: `div[data-box-name="Parameters"] table tbody tr`
**Extraction**: First `<td>` = label, second `<td>` = value

Key parameters found:
- **Stan** (Condition): "Nowy", "Używany", etc. - needs translation to English
- **Producent części** (Manufacturer/Brand): Brand name
- **Numer katalogowy części** (Part Number): Often the EAN if all digits

### EAN
Found in two places:
1. Image alt text: `"EAN (GTIN) 0840349928319"`
   ```html
   <img alt="Diesel Air Heater 12V 2KW... EAN (GTIN) 0840349928319">
   ```
   **Selector**: `img[alt*="EAN"]` → Extract with regex `/EAN\s*\(GTIN\)\s*(\d+)/i`

2. Parameters table under "Numer katalogowy części"

### Model
Found in description text:
```
<p>Numer modelu produktu: XMZ-D2</p>
```
**Extraction**: Regex match on description text `/(?:Numer modelu produktu|Model)[:\s]+([A-Z0-9\-]+)/i`

## Changes Made

### 1. Updated `scraping.interface.ts`
Added missing fields to `ScrapedProduct` interface:
```typescript
export interface ScrapedProduct {
  // ... existing fields ...
  model?: string;        // Product model extracted from description or parameters
  year?: number;         // Year of manufacture/production
  // ... rest of fields ...
}
```

### 2. Completely Rebuilt `parseProductDetails()` in `product-scraping.service.ts`

**Before**: Used incorrect selectors, missing many fields

**After**: Based on actual HTML structure with correct selectors

Key improvements:
- ✅ Title: Uses `h1.mgn2_21` (actual HTML structure)
- ✅ Price: Extracts from `meta[itemprop="price"]`
- ✅ Brand: Extracts from `meta[itemprop="brand"]` 
- ✅ Gallery Images: 
  - Finds thumbnails with `button img[src*="allegroimg.com/s128/"]`
  - Converts `/s128/` → `/original/` for full-size images
  - Deduplicates URLs
- ✅ Description: Extracts from `div[itemprop="description"]`
  - `description`: Plain text (truncated to 1000 chars)
  - `descriptionHtml`: Full HTML with formatting
- ✅ Parameters Table: Parses `div[data-box-name="Parameters"] table`
  - Extracts condition (Polish), manufacturer, part number, etc.
  - Stores all in `specifications` object
- ✅ EAN: Two fallback methods
  1. From parameters table (Numer katalogowy)
  2. From image alt text pattern
- ✅ Model: Regex extraction from description text
- ✅ Condition Translation: Uses `translateCondition()` utility

## Code Example

```typescript
// Extract brand from meta tag (confirmed in HTML at line 9670)
const brand = $('meta[itemprop="brand"]').attr('content')?.trim() || '';

// Gallery images from thumbnail buttons - convert from s128 to original
const galleryImages: string[] = [];
const seenUrls = new Set<string>();

$('button img[src*="allegroimg.com/s128/"]').each((_, img) => {
  let src = $(img).attr('src');
  if (src) {
    // Convert thumbnail to original size
    src = src.replace(/\/s128\//, '/original/');
    if (!seenUrls.has(src)) {
      seenUrls.add(src);
      galleryImages.push(src);
    }
  }
});

// Description HTML and plain text
const descriptionContainer = $('div[itemprop="description"]');
const descriptionHtml = descriptionContainer.html()?.trim() || '';
const description = descriptionContainer
  .text()
  .trim()
  .replace(/\s+/g, ' ')
  .substring(0, 1000);

// Parse parameters table
$('div[data-box-name="Parameters"] table tbody tr').each((_, row) => {
  const label = $(row).find('td').first().text().trim();
  const value = $(row).find('td').last().text().trim();
  const labelLower = label.toLowerCase();
  
  specifications[label] = value;
  
  if (labelLower.includes('stan')) {
    conditionPolish = value;
  } else if (labelLower.includes('producent części')) {
    manufacturer = value;
  }
  // ... etc
});

// EAN from image alt text
$('img[alt*="EAN"]').each((_, img) => {
  const altText = $(img).attr('alt') || '';
  const eanMatch = altText.match(/EAN\s*\(GTIN\)\s*(\d+)/i);
  if (eanMatch) {
    ean = eanMatch[1];
    return false; // break
  }
});

// Translate Polish condition to English
const translatedCondition = translateCondition(conditionPolish);
```

## Test Results

**Test Date**: October 9, 2025
**Command**: `npm run scrape:products -- --max=1 --json`

### Result
✅ Scraper compiles and runs successfully
✅ Product page fetched successfully
✅ Data extracted and saved to database
⚠️ First test product was from `allegrolokalnie.pl` (local listings) which may have different structure
⚠️ Subsequent product page requests experiencing timeouts (30+ seconds)

### Extracted Data
Based on database update query:
- Name: ✅ Extracted
- Price: ✅ Extracted (18500 PLN)
- Brand: ❓ Empty (allegrolokalnie may not have brand meta tag)
- Model: ❓ Not visible in query
- Year: ❓ Not visible in query  
- EAN: ❓ Not visible in query
- Description: ⚠️ Empty string (allegrolokalnie structure different)
- Condition: ⚠️ "Unknown" (Polish condition not found or not translated)
- Gallery Images: ⚠️ Empty (different image structure)

### Known Issues
1. **allegrolokalnie.pl** (local listings) has different HTML structure than allegro.pl
2. **Timeout issues** when fetching product pages (30-second timeouts)
3. **Need real allegro.pl product** (not allegrolokalnie) to test full extraction

## Recommendations

### 1. Test with Real allegro.pl Product
Test with a regular Allegro product (not allegrolokalnie):
```bash
npm run scrape:offer -- [allegro-offer-id]
```

### 2. Verify All Fields Extracted
Check a test product in database or JSON output to ensure all fields present:
- ✅ Name
- ✅ Price
- ✅ Brand
- ✅ Model
- ✅ Year
- ✅ Description (plain text)
- ✅ Description HTML
- ✅ Gallery Images (array of original-size URLs)
- ✅ Primary Image (first gallery image)
- ✅ EAN
- ✅ Condition (English translation)
- ✅ Manufacturer
- ✅ Specifications (all parameters)

### 3. Handle allegrolokalnie.pl
May need separate parsing logic for local listings if they're important.

### 4. Address Timeouts
Consider:
- Increasing timeout from 30s to 45s or 60s
- Better proxy configuration
- Rate limiting adjustments
- Retry strategy optimization

## Reference Files
- **HTML Reference**: `src/scraping/html-references/item-single.html` (10,499 lines)
- **Service File**: `src/scraping/product-scraping.service.ts`
- **Interface**: `src/scraping/interfaces/scraping.interface.ts`
- **Translation Utility**: `src/common/translations.util.ts`

## Next Steps
1. ✅ Interface updated with `model` and `year` fields
2. ✅ `parseProductDetails()` completely rebuilt based on actual HTML
3. ✅ All CSS selectors updated to match real structure
4. ✅ Gallery image extraction with size conversion
5. ✅ Description HTML extraction
6. ✅ Parameters table parsing
7. ✅ EAN extraction (multiple fallbacks)
8. ✅ Model extraction from description
9. ✅ Condition translation
10. ⏳ **Pending**: Test with real allegro.pl product (not allegrolokalnie)
11. ⏳ **Pending**: Verify all fields in database
12. ⏳ **Pending**: Address timeout issues
