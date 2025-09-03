# AutoRiven API - PostgreSQL Migration Guide

## Database Setup

This guide will help you set up the PostgreSQL database for the AutoRiven e-commerce platform.

### Prerequisites

1. **PostgreSQL** installed locally or access to a PostgreSQL server
2. **Node.js** and **npm** installed
3. **Git** for version control

### Environment Configuration

1. Copy the environment variables template:
```bash
cp .env.example .env
```

2. Update the `.env` file with your database credentials:
```bash
# Database Configuration
DB_HOST=autoriven.com
DB_PORT=5432
DB_USERNAME=autoriven
DB_PASSWORD=2b*JquuZj%Wkew54
DB_DATABASE=autoriven_db

# Other required variables...
```

### Database Setup Steps

#### 1. Create the Database

Connect to PostgreSQL and create the database:
```sql
CREATE DATABASE autoriven;
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Run Migrations

The migration will create all necessary tables and relationships:
```bash
npm run migration:run
```

This will create the following tables:
- `users` - Customer and admin accounts
- `categories` - Main product categories from Allegro
- `subcategories` - Subcategories linked to main categories
- `products` - Product listings
- `orders` - Customer orders with shipping/billing info
- `order_items` - Individual items within orders
- `payments` - Payment transactions and status
- `reviews` - Product reviews and ratings
- `notifications` - Email notifications (Brevo integration)

#### 4. Import Scraped Categories

After running the scraper to collect Allegro categories:
```bash
# First, scrape the categories
npm run scrape:categories

# Then seed the database with scraped data
npm run seed:categories
```

### Database Schema Overview

#### Core Entities

1. **Users**
   - Customer and administrator accounts
   - Profile information and authentication
   - Relationships: orders, payments, reviews, notifications

2. **Categories & Subcategories**
   - Hierarchical category structure from Allegro
   - Product categorization and navigation
   - Relationships: products, subcategories

3. **Products**
   - Automotive parts and accessories
   - Detailed specifications and pricing
   - Relationships: categories, reviews, order items

4. **Orders & Order Items**
   - Complete order management system
   - Shipping and billing address storage
   - Order status tracking (pending → delivered)
   - Relationships: users, products, payments

5. **Payments**
   - Payment transaction records
   - Multiple payment methods support
   - Refund and status tracking
   - Relationships: orders, users

6. **Reviews**
   - Product reviews and ratings
   - Moderation system with approval workflow
   - Verified purchase validation
   - Relationships: users, products, orders

7. **Notifications**
   - Brevo email integration
   - Order status updates, welcome emails, etc.
   - Template-based messaging system
   - Delivery tracking and analytics
   - Relationships: users, orders, products, payments

### Available Scripts

```bash
# Database Migrations
npm run migration:generate  # Generate new migration
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration
npm run schema:sync         # Sync schema (dev only)

# Data Seeding
npm run seed:categories     # Import scraped Allegro categories
npm run scrape:categories   # Scrape fresh category data

# Application
npm run start:dev          # Start development server
npm run build             # Build for production
npm run start:prod        # Start production server
```

### Development Workflow

1. **Initial Setup**
   ```bash
   npm install
   cp .env.example .env
   # Configure your .env file
   npm run migration:run
   ```

2. **Import Categories**
   ```bash
   npm run scrape:categories
   npm run seed:categories
   ```

3. **Start Development**
   ```bash
   npm run start:dev
   ```

### Production Deployment

1. Set `synchronize: false` in data source (already configured)
2. Use migrations in production:
   ```bash
   npm run migration:run
   ```
3. Never use `schema:sync` in production

### Brevo Email Integration

The notification system is designed to work with Brevo (formerly SendinBlue) for transactional emails:

1. Sign up at [Brevo](https://www.brevo.com/)
2. Get your API key and SMTP credentials
3. Update `.env` with Brevo configuration:
   ```bash
   BREVO_API_KEY=your_api_key
   BREVO_SMTP_HOST=smtp-relay.sendinblue.com
   BREVO_SMTP_PORT=587
   BREVO_FROM_EMAIL=noreply@autoriven.com
   ```

### Troubleshooting

**Connection Issues:**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `autoriven` exists

**Migration Errors:**
- Check for existing tables (drop if needed for fresh install)
- Verify user has CREATE privileges
- Run migrations one by one if batch fails

**Import Issues:**
- Ensure `results/categories.json` exists (run scraper first)
- Check category data format and structure
- Verify foreign key relationships

### Next Steps

After setting up the database:
1. Implement authentication middleware
2. Add product import functionality
3. Build order management endpoints
4. Set up Brevo email templates
5. Implement review moderation system

This PostgreSQL setup provides a robust foundation for the AutoRiven e-commerce platform with comprehensive relationship modeling and proper data integrity constraints.
