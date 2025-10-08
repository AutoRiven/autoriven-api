# Product Scraper Architecture Diagram

## Complete Scraping Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ALLEGRO.PL                                  │
│  https://allegro.pl/kategoria/czesci-samochodowe-620               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTP GET (via ScrapeDo proxy)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ScrapingHttpClient                               │
│  • Adds proxy headers                                               │
│  • Handles retries                                                  │
│  • User-Agent spoofing                                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTML Response
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              ProductScrapingService                                 │
│              parseProductListings()                                 │
│                                                                     │
│  1. Load HTML with Cheerio                                         │
│     const $ = cheerio.load(html);                                  │
│                                                                     │
│  2. Find Products Container                                        │
│     $('[data-role="itemsContainer"]')                              │
│                                                                     │
│  3. Iterate Articles                                               │
│     .find('article').each(...)                                     │
│                                                                     │
│  4. Extract Fields:                                                │
│     ┌─────────────────────────────────────┐                       │
│     │ • Name        (h2 a)                │                       │
│     │ • URL         (h2 a href)           │                       │
│     │ • Offer ID    (regex from URL)      │                       │
│     │ • Price       (p[aria-label])       │                       │
│     │ • Images      (ul img)              │                       │
│     │ • Condition   (dl dt/dd)            │                       │
│     │ • Manufacturer (dl dt/dd)           │                       │
│     │ • Part Number (dl dt/dd)            │                       │
│     │ • Rating      (aria-label)          │                       │
│     │ • Reviews     (span text)           │                       │
│     │ • Free Ship   (text search)         │                       │
│     └─────────────────────────────────────┘                       │
│                                                                     │
│  5. Generate AutoRiven Data                                        │
│     • autoRivenId (10000+)                                         │
│     • slug (Polish)                                                │
│     • englishSlug                                                  │
│     • nameEn (translation)                                         │
│     • englishUrl                                                   │
│                                                                     │
│  6. Create ScrapedProduct Object                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Array<ScrapedProduct>
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│         Translation & URL Generation                                │
│  • translateCategory(name) → nameEn                                │
│  • createSlug(name) → slug                                         │
│  • createEnglishSlug(name) → englishSlug                           │
│  • createAutoRivenUrl(slug, id) → englishUrl                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Enhanced Products
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│      ProductScrapingService.saveProductsToDatabase()                │
│                                                                     │
│  For each product:                                                 │
│  ┌──────────────────────────────────────────────────┐             │
│  │  1. Check if exists                              │             │
│  │     • By allegroId                               │             │
│  │     • By autoRivenId                             │             │
│  │                                                  │             │
│  │  2. If exists → UPDATE                           │             │
│  │     • Update all fields                          │             │
│  │     • Set lastScrapedAt                          │             │
│  │                                                  │             │
│  │  3. If new → CREATE                              │             │
│  │     • Set all fields                             │             │
│  │     • Set isActive = true                        │             │
│  │     • Set lastScrapedAt                          │             │
│  │                                                  │             │
│  │  4. Save to repository                           │             │
│  └──────────────────────────────────────────────────┘             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Saved Products
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                            │
│                         products table                              │
│                                                                     │
│  Columns:                                                           │
│  • id (uuid, PK)                                                   │
│  • allegroId (varchar)                                             │
│  • autoRivenId (integer, unique) ← NEW AUTO ID                     │
│  • name (varchar)                                                  │
│  • nameEn (varchar) ← ENGLISH NAME                                 │
│  • slug (varchar)                                                  │
│  • englishSlug (varchar) ← ENGLISH SLUG                            │
│  • allegroUrl (varchar)                                            │
│  • englishUrl (varchar) ← AUTORIVEN URL                            │
│  • price (decimal)                                                 │
│  • currency (varchar)                                              │
│  • manufacturer (varchar) ← NEW FIELD                              │
│  • partNumber (varchar)                                            │
│  • condition (varchar) ← NEW FIELD                                 │
│  • rating (decimal) ← NEW FIELD                                    │
│  • reviewCount (integer) ← NEW FIELD                               │
│  • freeDelivery (boolean) ← NEW FIELD                              │
│  • images (array)                                                  │
│  • inStock (boolean)                                               │
│  • categoryId (uuid, FK)                                           │
│  • subcategoryId (uuid, FK)                                        │
│  • lastScrapedAt (timestamp)                                       │
│  • createdAt (timestamp)                                           │
│  • updatedAt (timestamp)                                           │
└─────────────────────────────────────────────────────────────────────┘
```

## HTML Structure Deep Dive

```
Allegro Category Page
└── <div data-role="itemsContainer" id="search-results">
    ├── [filters and pagination - ignored]
    │
    └── <div class="opbox-listing">
        │
        ├── <article> ← PRODUCT 1
        │   ├── <div> ← Sponsored badge (optional)
        │   │   └── <p>Sponsorowane</p>
        │   │
        │   ├── <div> ← Image carousel
        │   │   └── <ul>
        │   │       ├── <li><img src="image1.jpg"></li>
        │   │       ├── <li><img src="image2.jpg"></li>
        │   │       └── <li><img src="image3.jpg"></li>
        │   │
        │   ├── <div> ← Product info
        │   │   ├── <h2>
        │   │   │   └── <a href="/oferta/...">Product Name</a>
        │   │   │
        │   │   ├── <div> ← Rating
        │   │   │   └── <div aria-label="4,56 na 5, 43 oceny">
        │   │   │
        │   │   └── <dl> ← Attributes
        │   │       ├── <dt>Stan</dt>
        │   │       ├── <dd>Nowy</dd>
        │   │       ├── <dt>Producent części</dt>
        │   │       ├── <dd>Vevor</dd>
        │   │       ├── <dt>Numer katalogowy</dt>
        │   │       └── <dd>840349928319</dd>
        │   │
        │   ├── <div> ← Price section
        │   │   ├── <p aria-label="369,99 zł aktualna cena">
        │   │   │   └── <span>369,99 zł</span>
        │   │   │
        │   │   └── <p>darmowa dostawa</p>
        │   │
        │   └── <div> ← Official store badge (optional)
        │
        ├── <article> ← PRODUCT 2
        ├── <article> ← PRODUCT 3
        └── ... (more products)
```

## Data Transformation Pipeline

```
┌──────────────────┐
│  Raw Allegro     │
│  HTML Data       │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Cheerio Parsing                                 │
│  • DOM traversal                                 │
│  • CSS selector matching                         │
│  • Text extraction                               │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Data Cleaning                                   │
│  • Trim whitespace                               │
│  • Parse numbers (price, rating)                 │
│  • Decode URLs                                   │
│  • Extract IDs (regex)                           │
│  • Filter duplicates (images)                    │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Enhancement                                     │
│  • Generate AutoRiven ID (10000+)                │
│  • Translate to English                          │
│  • Create slugs (Polish + English)               │
│  • Generate AutoRiven URLs                       │
│  • Upgrade image quality                         │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  ScrapedProduct Object                           │
│  {                                               │
│    allegroId: "16470296664",                     │
│    autoRivenId: 10001,                           │
│    name: "VEVOR Ogrzewanie...",                  │
│    nameEn: "VEVOR Parking Heater...",            │
│    price: 369.99,                                │
│    manufacturer: "Vevor",                        │
│    condition: "Nowy",                            │
│    rating: 4.56,                                 │
│    reviewCount: 43,                              │
│    freeDelivery: true,                           │
│    images: ["url1", "url2", ...],                │
│    ...                                           │
│  }                                               │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Database Persistence                            │
│  • Check if exists (allegroId/autoRivenId)       │
│  • UPDATE or CREATE                              │
│  • Set timestamps                                │
│  • Save to PostgreSQL                            │
└──────────────────────────────────────────────────┘
```

## API & CLI Integration

```
┌─────────────────────────────────────────────────────────────┐
│                    REST API Endpoints                       │
│                                                             │
│  POST /scraping/products/all                               │
│    ↓ calls ProductScrapingService.scrapeAllProducts()      │
│                                                             │
│  POST /scraping/products/category/:id                      │
│    ↓ calls ProductScrapingService.scrapeProductsByCategory()│
│                                                             │
│  POST /scraping/products/offer/:id                         │
│    ↓ calls ProductScrapingService.scrapeProductByOfferId() │
│                                                             │
│  POST /scraping/products/save-to-db                        │
│    ↓ calls ProductScrapingService.saveProductsToDatabase() │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      CLI Scripts                            │
│                                                             │
│  npm run scrape:products -- --max=10 --save                │
│    ↓ scripts/scrape-products.ts                            │
│    ↓ Parses CLI arguments                                  │
│    ↓ Calls appropriate service methods                     │
│    ↓ Optional: saves to database                           │
│                                                             │
│  npm run test:updated-scraper                              │
│    ↓ scripts/test-updated-scraper.ts                       │
│    ↓ Scrapes sample products                               │
│    ↓ Displays detailed output                              │
│    ↓ Saves to database                                     │
│    ↓ Verifies all fields populated                         │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Per-Product Try-Catch                                      │
│                                                             │
│  try {                                                      │
│    const product = parseProduct($article);                 │
│    if (hasRequiredFields) {                                │
│      products.push(product);                               │
│      logger.debug('✅ Parsed product');                    │
│    }                                                        │
│  } catch (error) {                                         │
│    logger.warn('⚠️  Failed to parse product');            │
│    // Continue with next product                           │
│  }                                                          │
│                                                             │
│  Result: Graceful degradation                              │
│  • One bad product doesn't crash entire scrape             │
│  • Detailed logging for debugging                          │
│  • Partial success is still useful                         │
└─────────────────────────────────────────────────────────────┘
```

---

**Architecture Version**: 2.0 (October 2025)
**Based on**: Current Allegro.pl HTML structure
