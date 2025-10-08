# Product Scraping - Quick Reference

## 🚀 Quick Start

### 1. Run Migration (First Time Only)
```bash
cd autoriven-api
npm run migration:run
```

### 2. Test the System
```bash
npm run test:product-scraping
```

### 3. Start Scraping
```bash
# Scrape 10 products and save
npm run scrape:products -- --max=10 --save
```

## 📖 Command Reference

### Get Help
```bash
npm run scrape:products:help
```

### Scrape All Products (Limited)
```bash
# Scrape max 10 products per category
npm run scrape:products -- --max=10 --save
```

### Scrape Specific Category
```bash
# First get category ID from database or API
# Then scrape that category
npm run scrape:products -- --category=YOUR_CATEGORY_UUID --max=50 --save
```

### Scrape Single Product
```bash
# Using Allegro offer ID (from URL like: allegro.pl/oferta/123456789)
npm run scrape:products -- --offer=123456789 --save
```

### Scrape Without Saving
```bash
# Results saved to JSON only, not database
npm run scrape:products -- --max=20
```

## 🌐 API Reference

### Base URL
```
http://localhost:3000/scraping/products
```

### Authentication
All endpoints require:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Endpoints

#### 1. Scrape All Products
```http
POST /scraping/products/all?maxPerCategory=10
```

#### 2. Scrape Category
```http
POST /scraping/products/category/:categoryId?categoryId=UUID&maxProducts=50
```

#### 3. Scrape by Offer ID
```http
POST /scraping/products/offer/:offerId?offerId=123456789
```

#### 4. Scrape Category and Save
```http
POST /scraping/products/category/:categoryId/save?categoryId=UUID&maxProducts=50
```

## 📊 Example Workflow

### Complete Scraping Workflow

1. **Get Category ID**
   ```sql
   SELECT id, name, "allegroUrl" 
   FROM subcategories 
   WHERE "hasProducts" = true 
   LIMIT 10;
   ```

2. **Scrape Category**
   ```bash
   npm run scrape:products -- --category=CATEGORY_ID --max=100 --save
   ```

3. **Verify Results**
   ```sql
   SELECT COUNT(*) FROM products;
   SELECT * FROM products ORDER BY "createdAt" DESC LIMIT 5;
   ```

## 🔍 Common Use Cases

### Test Scraping (Small Sample)
```bash
npm run scrape:products -- --max=5 --save
```

### Scrape Specific Brand/Category
```bash
# Find category for "Filtry powietrza" or similar
# Get its ID from database
npm run scrape:products -- --category=FILTRY_UUID --max=200 --save
```

### Scrape High-Priority Products
```bash
# Scrape from popular categories first
npm run scrape:products -- --category=POPULAR_CAT_1 --max=100 --save
npm run scrape:products -- --category=POPULAR_CAT_2 --max=100 --save
```

### Update Existing Products
```bash
# Scraping same category again updates existing products
npm run scrape:products -- --category=CATEGORY_ID --save
```

## 🗄️ Database Queries

### Check Products
```sql
-- Count total products
SELECT COUNT(*) FROM products;

-- Recent products
SELECT name, price, "autoRivenId", "createdAt" 
FROM products 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Products by category
SELECT p.name, p.price, s.name as category 
FROM products p 
JOIN subcategories s ON p."subcategoryId" = s.id 
LIMIT 20;

-- Products with AutoRiven IDs
SELECT name, "autoRivenId", "englishSlug", "englishUrl" 
FROM products 
WHERE "autoRivenId" IS NOT NULL 
LIMIT 10;
```

### Find Categories to Scrape
```sql
-- Categories with products
SELECT id, name, "allegroUrl", "productCount" 
FROM subcategories 
WHERE "hasProducts" = true 
ORDER BY "productCount" DESC 
LIMIT 20;
```

## 📁 Output Files

Results saved to: `results/allegro-products-*.json`

```bash
# List recent results
ls -lt results/allegro-products-*.json | head -5
```

## ⚠️ Important Notes

1. **Rate Limiting**: Scraper includes 2-3 second delays
2. **Database**: Always use `--save` for production
3. **Testing**: Start with small `--max` values
4. **Categories**: Scrape from subcategories, not main categories
5. **IDs**: AutoRiven IDs start at 10000

## 🐛 Troubleshooting

### No Products Found
- Category might not have products
- Check category URL is accessible
- Verify HTML selectors

### Duplicate Key Errors
- Products already exist in database
- Normal when re-scraping same category

### Network Timeouts
- Increase delay in config
- Check internet connection
- Verify proxy settings

## 📞 Support

For issues or questions:
1. Check logs in terminal
2. Review `PRODUCT_SCRAPING.md` for details
3. Check database for existing data

## 🎯 Performance Tips

1. **Start Small**: Use `--max=10` for testing
2. **Target Categories**: Scrape specific popular categories
3. **Monitor Logs**: Watch for errors or issues
4. **Check Results**: Verify data before large scrapes
5. **Use Delays**: Don't remove rate limiting

## 🔗 Related Commands

```bash
# Category scraping
npm run scrape:categories
npm run save:categories

# Database
npm run migration:run
npm run seed

# Testing
npm run test:product-scraping
```

---

**Quick Start Checklist:**
- [ ] Run migration
- [ ] Test with single product
- [ ] Scrape small sample (--max=10)
- [ ] Verify database
- [ ] Scale up as needed
