# AutoRiven API

A clean, optimized NestJS backend API with PostgreSQL database and live Allegro.pl category scraping for automotive parts.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Administrator, Customer)
  - Secure password hashing with bcrypt

- **Database Integration**
  - PostgreSQL with TypeORM
  - Automotive category hierarchy
  - Product management entities

- **Live Scraping (Allegro.pl)**
  - Real-time category extraction from Allegro.pl
  - 187+ automotive categories with hierarchy
  - Anti-bot protection bypass with scrape.do proxy
  - Polish to English translation
  - Automatic result export to JSON

- **API Features**
  - RESTful API design
  - Input validation with class-validator
  - Data transformation with class-transformer
  - Global error handling
  - CORS configuration

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Elasticsearch (v8.0 or higher)
- Scrape.do API token (for web scraping)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AutoRiven/autoriven-api.git
   cd autoriven-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your database and Elasticsearch configurations.

4. Start PostgreSQL and Elasticsearch services.

5. Run database migrations (if any):
   ```bash
   npm run migration:run
   ```

### Running the Application

#### Development Mode
```bash
npm run start:dev
```

#### Production Mode
```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Customer role)
- `GET /api/auth/profile` - Get current user profile
- `GET /api/auth/admin-check` - Admin access verification
- `POST /api/auth/create-admin` - Create administrator user (Admin only)

### Users Management
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `POST /api/users` - Create new user (Admin only)
- `PATCH /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/administrators` - Get all administrators (Admin only)
- `GET /api/users/customers` - Get all customers (Admin only)
- `POST /api/users/administrators` - Create administrator (Admin only)

### Search
- `GET /api/search/users` - Search users with filters (Admin only)

### Web Scraping (Allegro.pl)
- `GET /api/scraping/health` - Scraping service health check (Admin only)
- `GET /api/scraping/categories` - Scrape Allegro categories (Admin only)
- `GET /api/scraping/categories/:categoryUrl/subcategories` - Scrape subcategories (Admin only)
- `GET /api/scraping/products` - Scrape products from category (Admin only)
- `GET /api/scraping/search` - Search products on Allegro (Admin only)
- `GET /api/scraping/product/:productUrl` - Get detailed product info (Admin only)
- `POST /api/scraping/batch-scrape` - Batch scraping operation (Admin only)

## User Roles

### Administrator
- Full access to all endpoints
- Can manage users (create, read, update, delete)
- Can create other administrators
- Can search and filter users

### Customer
- Access to their own profile
- Can update their own information
- Limited access to public endpoints

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USERNAME` | Database username | - |
| `DATABASE_PASSWORD` | Database password | - |
| `DATABASE_NAME` | Database name | `autoriven_db` |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRATION_TIME` | JWT token expiration | `24h` |
| `ELASTICSEARCH_NODE` | Elasticsearch URL | `http://localhost:9200` |
| `ELASTICSEARCH_USERNAME` | Elasticsearch username | - |
| `ELASTICSEARCH_PASSWORD` | Elasticsearch password | - |
| `SCRAPE_DO_TOKEN` | Scrape.do API token | - |
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:5173` |

## Database Schema

### User Entity
- `id` - UUID primary key
- `email` - Unique email address
- `firstName` - User's first name
- `lastName` - User's last name
- `password` - Hashed password
- `role` - User role (administrator/customer)
- `phone` - Phone number (optional)
- `address` - Street address (optional)
- `city` - City (optional)
- `country` - Country (optional)
- `postalCode` - Postal code (optional)
- `isActive` - Account status
- `emailVerified` - Email verification status
- `lastLoginAt` - Last login timestamp
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

## Search Capabilities

The Elasticsearch integration provides:

- **Full-text search** across user fields
- **Fuzzy matching** for typos and variations
- **Filtering** by role, status, location
- **Sorting** options
- **Pagination** support

### Search Query Examples

```bash
# Search users by name
GET /api/search/users?q=john

# Filter by role
GET /api/search/users?role=customer

# Filter by location
GET /api/search/users?city=New York&country=USA

# Combined search and filters
GET /api/search/users?q=john&role=customer&isActive=true
```

## Development

### Scripts

- `npm run start` - Start application
- `npm run start:dev` - Start in watch mode
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build application
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── decorators/       # Custom decorators
│   ├── dto/             # Data transfer objects
│   ├── guards/          # Auth guards
│   └── strategies/      # Passport strategies
├── users/               # Users module
│   ├── dto/            # User DTOs
│   ├── entities/       # User entity
│   └── ...
├── search/             # Search module
│   └── ...
├── app.module.ts       # Root application module
└── main.ts            # Application entry point
```

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Role-based access control (RBAC)
- Input validation on all endpoints
- CORS configuration
- Environment variable protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the ISC License.
