# AutoRiven API

A comprehensive NestJS-based backend application for automotive e-commerce, featuring advanced web scraping capabilities, PostgreSQL database integration, and Elasticsearch search functionality.

## 🚀 Features

- **Web Scraping**: Advanced Allegro.pl category and product scraping with proxy support
- **Database**: PostgreSQL with TypeORM for data persistence  
- **Search**: Elasticsearch integration for fast product search
- **Authentication**: JWT-based authentication with role-based access control
- **API**: RESTful API endpoints for all core functionality
- **Health Checks**: Built-in health monitoring
- **Data Seeding**: Automated database seeding for categories and initial data

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher) 
- Elasticsearch (v8 or higher)
- npm package manager

## 🛠️ Installation & Setup

### 1. Clone and Install
```bash
git clone https://github.com/AutoRiven/autoriven-api.git
cd autoriven-api
npm install
```

### 2. Environment Configuration
Copy the environment example file and configure:
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=autoriven_db

# Elasticsearch Configuration  
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_elasticsearch_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Scraping Configuration
SCRAPE_DO_TOKEN=your_scrape_do_proxy_token

# Application
NODE_ENV=development
PORT=3000
```

### 3. Database Setup
```bash
# Run database migrations
npm run migration:run

# Seed initial data (creates admin user)
npm run seed
```

### 4. Start Application
```bash
# Development mode
npm run start:dev

# Production mode  
npm run build
npm run start:prod
```

## 📁 Project Structure

```
src/
├── auth/                 # Authentication & authorization
│   ├── decorators/      # Custom decorators (roles, current user)
│   ├── dto/            # Auth DTOs (login, register)
│   ├── guards/         # Guards (JWT, local, roles)
│   └── strategies/     # Passport strategies (JWT, local)
├── database/           # Database configuration & seeding
│   ├── migrations/     # TypeORM migrations
│   └── seeders/       # Database seeders
├── health/            # Health check endpoints
├── products/          # Product & category entities
│   ├── entities/      # TypeORM entities (Category, Product, Subcategory)
│   └── services/      # Business logic services
├── scraping/          # Web scraping functionality
│   ├── interfaces/    # TypeScript interfaces
│   └── utils/         # HTTP client & translation utilities
├── search/            # Elasticsearch search functionality
└── users/             # User management
    ├── dto/           # User DTOs
    └── entities/      # User entity
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the application |
| `npm run start` | Start production server |
| `npm run start:dev` | Start development server with hot reload |
| `npm run start:debug` | Start with debugging enabled |
| `npm run seed` | Run database seeder |
| `npm run migration:generate` | Generate new migration |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run scrape:categories` | Run category scraping script |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile (authenticated)

### Scraping (Admin only)
- `GET /scraping/health` - Scraping service health check
- `POST /scraping/categories` - Start category scraping

### Health
- `GET /health` - Application health status

### Search
- Search endpoints for products and categories

## 🗄️ Database Schema

### Key Entities

**User**
- Authentication and user management
- Role-based access control (USER, ADMINISTRATOR)

**Category** 
- Hierarchical category structure
- Automotive-focused categories from Allegro.pl
- Multi-level categorization (0-7 levels)

**Subcategory**
- Extended category hierarchy
- Self-referencing for deep nesting

**Product**
- Product information
- Category associations
- Elasticsearch integration

## 🔍 Scraping System

The application includes a sophisticated web scraping system for Allegro.pl with comprehensive product data extraction.

### Enhanced Features (October 2024)
- ✨ **Dual-Mode Scraping**: Listing pages (quick discovery) + Detail pages (full data)
- 📸 **Gallery Images**: High-resolution product galleries with automatic quality optimization
- 📝 **Rich Descriptions**: HTML-preserved product descriptions with formatting and images
- 🏷️ **Product Codes**: EAN/GTIN extraction for inventory management
- ⭐ **Seller Information**: Seller names and 5-point rating system
- 🔗 **Category Association**: Automatic product-to-category linking

### Core Features
- **Proxy Support**: Uses ScrapeOwl proxy service for reliable scraping
- **Hierarchical Scraping**: Automatically discovers and maps category hierarchies
- **Automotive Focus**: Specialized scraping for automotive categories
- **Fallback Handling**: Handles missing categories with predefined fallbacks
- **Rate Limiting**: Configurable delays to respect target site limits

### Product Data Extracted

**From Listing Pages**:
- Product name, price, currency
- Thumbnail images
- Basic attributes (condition, manufacturer)
- Ratings and review counts
- Free delivery status

**From Detail Pages** (Enhanced):
- 📸 Gallery images (original quality)
- 📝 Full HTML description
- 🏷️ EAN/GTIN product codes
- 👤 Seller name and rating
- 🔧 Complete specifications
- 📦 Product condition and brand

### Usage
```bash
# Run category scraping
npm run scrape:categories

# Test product scraping with new fields
npx ts-node scripts/test-product-scraping.ts
```

### API Endpoints
```http
# Scrape products from category
POST /api/scraping/scrape-products/:categoryId
Content-Type: application/json
{ "maxProducts": 10 }

# Scrape single product by offer ID
POST /api/scraping/scrape-product/:offerId
```

### Configuration
Configure scraping in your `.env`:
```env
SCRAPE_DO_TOKEN=your_proxy_token
ALLEGRO_BASE_URL=https://allegro.pl
```

### Database Schema

See `docs/PRODUCT_SCRAPING.md` for complete documentation.

**Recent Migrations**:
- `1728291000000-AddProductEnhancedFields`: Added descriptionHtml, galleryImages, ean, sellerName, sellerRating

### Documentation
- 📖 Comprehensive Guide: `docs/PRODUCT_SCRAPING.md`
- 📊 Enhancement Summary: `SCRAPING_ENHANCEMENT_SUMMARY.md`
- 🧪 Test Script: `scripts/test-product-scraping.ts`

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Administrator and user roles
- **Password Hashing**: bcrypt for secure password storage
- **Guards**: Custom guards for route protection

## 🚀 Deployment

### Development
```bash
npm run start:dev
```

### Production  
```bash
npm run build
npm run start:prod
```

### Docker (Coming Soon)
Docker configuration will be added for easy deployment.

## 🛠️ Development

### Code Quality
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **TypeScript**: Full TypeScript support

### Database Migrations
```bash
# Generate migration
npm run migration:generate src/database/migrations/YourMigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## 📊 Monitoring & Health

- Health check endpoints for monitoring application status
- Elasticsearch integration status
- Database connection monitoring

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support, please create an issue in the GitHub repository or contact the development team.

---

**AutoRiven** - Advanced Automotive E-commerce Solution
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # Elasticsearch Configuration
   ELASTICSEARCH_NODE=http://localhost:9200
   ELASTICSEARCH_USERNAME=elastic
   ELASTICSEARCH_PASSWORD=your_elastic_password
   
   # Scraping Configuration
   SCRAPE_DO_TOKEN=your_scrape_do_token
   
   # Application Configuration
   NODE_ENV=development
   PORT=3000
   ```

## 🗄️ Database Setup

1. **Create PostgreSQL Database**
   ```sql
   CREATE DATABASE autoriven_db;
   CREATE USER autoriven_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE autoriven_db TO autoriven_user;
   ```

2. **Run Database Migrations**
   ```bash
   npm run migration:run
   ```

3. **Seed Initial Data**
   ```bash
   npm run seed
   npm run seed:categories
   ```

## 🔍 Elasticsearch Setup

1. **Start Elasticsearch** (using Docker)
   ```bash
   docker run -d \
     --name elasticsearch \
     -p 9200:9200 \
     -p 9300:9300 \
     -e "discovery.type=single-node" \
     -e "xpack.security.enabled=false" \
     docker.elastic.co/elasticsearch/elasticsearch:8.11.0
   ```

2. **Verify Connection**
   ```bash
   curl http://localhost:9200
   ```

## 🚦 Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users` - List all users (Admin only)

### Products
- `GET /products` - List products with pagination and filters
- `GET /products/:id` - Get product details
- `POST /products` - Create new product (Admin only)
- `PUT /products/:id` - Update product (Admin only)
- `DELETE /products/:id` - Delete product (Admin only)

### Categories
- `GET /categories` - List all categories
- `GET /categories/:id` - Get category details
- `GET /categories/:id/products` - Get products in category

### Search
- `GET /search/products` - Search products
- `POST /search/index` - Reindex search data (Admin only)

### Scraping
- `POST /scraping/categories` - Start category scraping (Admin only)
- `GET /scraping/results/latest` - Get latest scraping results
- `GET /scraping/health` - Check scraping service health

### Health
- `GET /health` - Application health check

## 🔧 Available Scripts

### Development
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Database
- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run schema:sync` - Sync database schema (dev only)
- `npm run seed` - Run database seeders
- `npm run seed:categories` - Seed categories specifically

### Scraping
- `npm run scrape:categories` - Run category scraping script

### Production
- `npm run build` - Build the application
- `npm run start:prod` - Start in production mode

## 🕸️ Web Scraping

### Overview
The application includes a sophisticated web scraping system designed to extract product categories and data from Allegro.pl, Poland's largest e-commerce platform.

### Features
- **Proxy Support**: Uses scrape.do proxy service for reliable scraping
- **Rate Limiting**: Built-in request throttling to respect target site
- **Retry Logic**: Automatic retry with exponential backoff
- **Deep Hierarchy**: Supports scraping up to 6 levels of category hierarchy
- **Translation**: Automatic Polish-to-English category translation
- **Data Validation**: Comprehensive data validation and cleaning

### Configuration
```typescript
// Default scraping configuration
{
  proxyToken: 'your_scrape_do_token',
  baseUrl: 'https://allegro.pl',
  userAgent: 'Mozilla/5.0...',
  requestDelay: 1000, // 1 second between requests
  maxRetries: 3,
}
```

### Running Scraping
```bash
# Run via npm script
npm run scrape:categories

# Or via API endpoint (Admin required)
curl -X POST http://localhost:3000/scraping/categories \
  -H "Authorization: Bearer your_jwt_token"
```

### Results
Scraping results are saved to the `results/` directory with timestamps:
```
results/
├── allegro-categories-2025-09-08T08-32-55-683Z.json
└── allegro-categories-breadcrumb-corrected-2025-09-08T08-44-53-033Z.json
```

## 🏗️ Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── decorators/      # Custom decorators
│   ├── dto/             # Data transfer objects
│   ├── guards/          # Auth guards
│   └── strategies/      # Passport strategies
├── database/            # Database configuration
│   ├── migrations/      # TypeORM migrations
│   └── seeders/         # Database seeders
├── products/            # Product management
│   └── entities/        # Product entities
├── scraping/            # Web scraping module
│   ├── dto/             # Scraping DTOs
│   ├── interfaces/      # TypeScript interfaces
│   └── utils/           # Scraping utilities
├── search/              # Elasticsearch integration
├── users/               # User management
└── health/              # Health check module

scripts/
└── scrape-categories.ts # Standalone scraping script

results/                 # Scraping results storage
```

## 🔐 Authentication & Authorization

### User Roles
- **USER**: Basic user with limited access
- **ADMINISTRATOR**: Full access to all endpoints
- **MODERATOR**: Extended access for content management

### Protected Routes
Most endpoints require authentication. Use the JWT token in the Authorization header:
```bash
Authorization: Bearer <your_jwt_token>
```

### Admin-Only Endpoints
- All scraping endpoints
- User management
- Product creation/modification
- Search indexing

## 📊 Database Schema

### Core Entities
- **User**: User accounts and authentication
- **Category**: Product categories hierarchy
- **Subcategory**: Category subdivisions
- **Product**: Product information and metadata

### Relationships
- Users can have multiple orders
- Products belong to categories and subcategories
- Categories form a hierarchical tree structure

## 🔍 Search Functionality

### Elasticsearch Integration
The application uses Elasticsearch for fast, full-text product search with features:
- Multi-field search (title, description, specifications)
- Faceted search (category, price range, brand)
- Auto-complete suggestions
- Relevance scoring

### Search API
```bash
# Basic search
GET /search/products?q=brake+pads&category=car-parts

# Advanced search with filters
GET /search/products?q=oil+filter&minPrice=10&maxPrice=50&brand=bosch
```

## 🚨 Error Handling

The application implements comprehensive error handling:
- **Validation Errors**: Detailed field-level validation messages
- **Authentication Errors**: Clear auth failure responses
- **Database Errors**: Graceful database error handling
- **Scraping Errors**: Retry logic with detailed error reporting

## 📈 Monitoring & Health Checks

### Health Endpoints
- `GET /health` - Overall application health
- `GET /health/database` - Database connectivity
- `GET /health/elasticsearch` - Search service status
- `GET /scraping/health` - Scraping service status

### Logging
Structured logging with different levels:
- **Error**: System errors and exceptions
- **Warn**: Warning conditions
- **Info**: General information
- **Debug**: Detailed debug information

## 🔧 Environment Variables

### Required Variables
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=autoriven_db
JWT_SECRET=your-super-secret-jwt-key
```

### Optional Variables
```env
NODE_ENV=development
PORT=3000
JWT_EXPIRES_IN=7d
ELASTICSEARCH_NODE=http://localhost:9200
SCRAPE_DO_TOKEN=your_token
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up Elasticsearch cluster
4. Configure proxy/load balancer
5. Set up SSL certificates

## 📝 API Documentation

### Swagger/OpenAPI
The API documentation is automatically generated and available at:
```
http://localhost:3000/api/docs
```

### Postman Collection
Import the Postman collection for easy API testing:
```
docs/autoriven-api.postman_collection.json
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript
- Follow ESLint configuration
- Write comprehensive tests
- Document new features
- Use conventional commits

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Elasticsearch Documentation](https://www.elastic.co/guide)

### Issues
For bug reports and feature requests, please use the [GitHub Issues](https://github.com/AutoRiven/autoriven-api/issues) page.

### Contact
- Email: support@autoriven.com
- Website: https://autoriven.com

---

**AutoRiven API** - Powering the future of automotive e-commerce 🚗✨
