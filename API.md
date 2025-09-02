# AutoRiven API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Health Check
- **GET** `/health` - General health check
- **GET** `/health/database` - Database health check
- **GET** `/health/elasticsearch` - Elasticsearch health check

### Authentication
- **POST** `/auth/register` - Register new customer
- **POST** `/auth/login` - User login
- **GET** `/auth/profile` - Get current user profile (Protected)
- **GET** `/auth/admin-check` - Verify admin access (Admin only)
- **POST** `/auth/create-admin` - Create administrator (Admin only)

### User Management
- **GET** `/users` - Get all users (Admin only)
- **GET** `/users/:id` - Get user by ID (Admin only)
- **POST** `/users` - Create new user (Admin only)
- **PATCH** `/users/:id` - Update user (Admin only)
- **DELETE** `/users/:id` - Delete user (Admin only)
- **GET** `/users/administrators` - Get all administrators (Admin only)
- **GET** `/users/customers` - Get all customers (Admin only)
- **POST** `/users/administrators` - Create administrator (Admin only)

### Search
- **GET** `/search/users` - Search users with filters (Admin only)

## Request/Response Examples

### Register Customer
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "customer@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "Password@123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2025-09-02T...",
    "updatedAt": "2025-09-02T..."
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@autoriven.com",
  "password": "Admin@123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@autoriven.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "administrator",
    "isActive": true,
    "emailVerified": true,
    "lastLoginAt": "2025-09-02T...",
    "createdAt": "2025-09-02T...",
    "updatedAt": "2025-09-02T..."
  }
}
```

### Create User (Admin)
```http
POST /api/users
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "firstName": "New",
  "lastName": "User",
  "password": "Password@123",
  "role": "customer",
  "phone": "+1234567890",
  "city": "New York",
  "country": "USA"
}
```

### Search Users (Admin)
```http
GET /api/search/users?q=john&role=customer&isActive=true&city=New York
Authorization: Bearer <admin_jwt_token>
```

Response:
```json
{
  "total": 1,
  "users": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "role": "customer",
      "city": "New York",
      "country": "USA",
      "isActive": true,
      "emailVerified": true,
      "createdAt": "2025-09-02T...",
      "updatedAt": "2025-09-02T..."
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

## Status Codes

- **200** - OK
- **201** - Created
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (duplicate resource)
- **500** - Internal Server Error

## User Roles

### Customer
- Can register and login
- Can view their own profile
- Can update their own information

### Administrator
- Full access to all endpoints
- Can manage all users
- Can create other administrators
- Can search and filter users
- Can access health check endpoints
