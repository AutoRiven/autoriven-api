import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../users/entities/user.entity';
import { Category } from '../products/entities/category.entity';
import { Subcategory } from '../products/entities/subcategory.entity';
import { Product } from '../products/entities/product.entity';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'autoriven',
  synchronize: false, // Set to false for production, use migrations instead
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Category,
    Subcategory,
    Product,
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/**/*.subscriber.ts'],
});

// Only export as default for TypeORM CLI
export default AppDataSource;
