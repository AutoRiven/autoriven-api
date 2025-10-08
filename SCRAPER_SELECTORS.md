# Allegro Product Scraper - HTML Selector Reference

## Current Allegro Structure (October 2025)

This document maps the exact HTML selectors used by the scraper to extract product data from Allegro.pl.

## Main Container

```html
<div data-role="itemsContainer" id="search-results">
  <!-- All products are inside this container -->
</div>
```

**Selector**: `[data-role="itemsContainer"]`

## Product Listing (Article)

```html
<article class="mjyo_6x mse2_k4 mx7m_1 mnyp_co mlkp_ag">
  <!-- Product data here -->
</article>
```

**Selector**: `article` (within itemsContainer)
**Note**: Each `<article>` represents one product

## Product Name

```html
<h2 class="mgn2_14 m9qz_yp mqu1_16 mp4t_0 m3h2_0 mryx_0 munh_0">
  <a href="..." class="...">VEVOR Ogrzewanie postojowe Nagrzewnica 12V2KW</a>
</h2>
```

**Selector**: `h2 a`
**Extraction**: `.text().trim()`

## Product URL

### Option 1: Direct Link
```html
<a href="https://allegro.pl/oferta/diesel-air-heater-12v-2kw-bluetooth-app-16470296664">
```

### Option 2: Event Tracking Link
```html
<a href="https://allegro.pl/events/clicks?...&redirect=https%3A%2F%2Fallegro.pl%2Foferta%2F...">
```

**Selector**: `h2 a` → `attr('href')`
**Processing**:
- If contains `/events/clicks`, extract `redirect` parameter
- Decode URI component
- Extract offer ID using regex: `/\/oferta\/[^\/]*?-?(\d+)(?:\?|$)/`

## Price

```html
<p aria-label="369,99&nbsp;zł aktualna cena" tabindex="0" class="...">
  <span class="...">
    369,<span class="...">99</span>&nbsp;<span class="...">zł</span>
  </span>
</p>
```

**Selector**: `p[aria-label*="aktualna cena"]`
**Extraction**: 
- Get text content
- Remove non-numeric characters except comma
- Replace comma with period
- Parse as float

## Product Images

```html
<ul class="mpof_ki m389_6m ...">
  <li class="mpof_ki m389_6m m7f5_6m mse2_k4 m7er_k4 ...">
    <img src="https://a.allegroimg.com/s360/11e7f4/74f004494e90b4c0db82113f0b15/..." alt="">
  </li>
  <li>
    <img src="https://a.allegroimg.com/s360/11f9b1/d289c7c047a7a26818347a24d50d/..." alt="">
  </li>
  <!-- More images... -->
</ul>
```

**Selector**: `ul img`
**Extraction**:
- Get all `src` attributes
- Filter for URLs containing `allegroimg.com`
- Replace `/s360/` with `/original/` for highest quality
- Remove duplicates

## Product Condition (Stan)

```html
<dl class="mgn2_12 mp4t_0 ...">
  <dt class="mpof_uk ...">Stan</dt>
  <dd class="mpof_uk ...">Nowy</dd>
</dl>
```

**Selector**: `dl dt` → find text "Stan" → `.next('dd').text()`
**Values**: Nowy, Używany, etc.

## Manufacturer (Producent części)

```html
<dl class="mgn2_12 mp4t_0 ...">
  <dt class="mpof_uk ...">Producent części</dt>
  <dd class="mpof_uk ...">Vevor</dd>
</dl>
```

**Selector**: `dl dt` → find text "Producent części" → `.next('dd').text()`

## Part Number (Numer katalogowy części)

```html
<dl class="mgn2_12 mp4t_0 ...">
  <dt class="mpof_uk ...">Numer katalogowy części</dt>
  <dd class="mpof_uk ...">840349928319</dd>
</dl>
```

**Selector**: `dl dt` → find text "Numer katalogowy części" → `.next('dd').text()`

## Product Rating

```html
<div aria-label="4,56 na 5, 43 oceny produktu" role="group" class="...">
  <span aria-hidden="true" class="m9qz_yq mgmw_wo">4,56</span>
  <!-- Rating stars -->
  <span aria-hidden="true" class="mpof_uk">(43)</span>
</div>
```

**Selector**: `[aria-label*="na 5"]`
**Extraction**:
- Get `aria-label` attribute
- Match regex: `/([\d,]+)\s+na\s+5/`
- Replace comma with period
- Parse as float

## Review Count

```html
<span aria-hidden="true" class="mpof_uk">(43)</span>
```

**Selector**: Rating element → `span.mpof_uk`
**Extraction**:
- Get text content
- Match regex: `/\((\d+)\)/`
- Parse as integer

## Free Delivery

```html
<p class="mqu1_g3 mgn2_12 ...">darmowa dostawa</p>
```

**Selector**: Look for text "darmowa dostawa" anywhere in article
**Extraction**: Boolean - true if found, false otherwise

## Delivery Date (Optional)

```html
<span class="mpof_uk ...">
  <span style="color: rgb(250, 195, 20); ...">
    dostawa pt. 10 paź. – czw. 16 paź.
  </span>
</span>
```

**Selector**: `span[style*="rgb(250, 195, 20)"]` containing "dostawa"
**Note**: Currently not extracted, but available for future enhancement

## Sponsored Product Badge

```html
<div class="mp0t_0a mgn2_12 mqu1_16 ...">
  <p class="mp4t_0 m3h2_0 mryx_0 munh_0 mpof_uk">Sponsorowane</p>
</div>
```

**Selector**: `p` containing text "Sponsorowane"
**Note**: Indicates sponsored/promoted product listing

## Official Store Badge

```html
<div title="Oficjalny sklep VEVOR" class="...">
  <p class="mgmw_3z mpof_z0 mgn2_12 ...">Oficjalny sklep</p>
</div>
```

**Selector**: Text "Oficjalny sklep"
**Note**: Currently not extracted, but could be useful

## Purchase Count

```html
<button aria-label="322 osoby kupiły ostatnio zobacz szczegóły" ...>
  <span class="...">
    <span style="color: var(--m-color-text, #222222); font-weight: bold;">322 osoby</span>
    <span style="color: var(--m-color-text-secondary, #656565);">kupiły ostatnio</span>
  </span>
</button>
```

**Selector**: Button with `aria-label` containing "kupiły ostatnio"
**Note**: Available for future enhancement

## Complete Scraping Flow

```typescript
// 1. Load HTML with Cheerio
const $ = cheerio.load(html);

// 2. Find main container
const itemsContainer = $('[data-role="itemsContainer"]');

// 3. Iterate through articles
itemsContainer.find('article').each((_, element) => {
  const $article = $(element);
  
  // 4. Extract each field using selectors above
  const name = $article.find('h2 a').text().trim();
  const url = $article.find('h2 a').attr('href');
  const price = extractPrice($article.find('p[aria-label*="aktualna cena"]').text());
  const images = extractImages($article.find('ul img'));
  const attributes = extractAttributes($article.find('dl dt'));
  const rating = extractRating($article.find('[aria-label*="na 5"]'));
  
  // 5. Create product object
  const product = {
    name,
    url,
    price,
    images,
    manufacturer: attributes['Producent części'],
    condition: attributes['Stan'],
    rating,
    // ... etc
  };
});
```

## Selector Priority

When multiple selectors could work, use this priority:

1. **`data-role` attributes** - Most stable (rarely changed)
2. **`aria-label` attributes** - Accessible and semantic
3. **Element structure** (h2, article, etc.) - Fairly stable
4. **Class names** - Least stable (can change with design updates)

## Testing Selectors

To test if selectors still work:

```bash
# Run the test script
npm run test:updated-scraper

# Expected: Products with all fields populated
# If fields are missing, selectors may need updating
```

## Updating Selectors

If Allegro changes their HTML:

1. Save new HTML to `src/scraping/html-references/items-container.html`
2. Open in browser and inspect elements
3. Update selectors in `product-scraping.service.ts`
4. Run test script to verify
5. Update this document with new structure

---

**Last Updated**: October 8, 2025
**Verified Against**: https://allegro.pl/kategoria/czesci-samochodowe-620
**Structure Version**: October 2025
