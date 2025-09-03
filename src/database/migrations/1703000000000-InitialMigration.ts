import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1703000000000 implements MigrationInterface {
  name = 'InitialMigration1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums first
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('administrator', 'customer')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."payments_method_enum" AS ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery', 'stripe', 'razorpay')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."reviews_status_enum" AS ENUM('pending', 'approved', 'rejected')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."notifications_type_enum" AS ENUM('order_confirmation', 'order_shipped', 'order_delivered', 'order_cancelled', 'payment_success', 'payment_failed', 'account_verification', 'password_reset', 'welcome', 'promotional', 'review_request', 'wishlist_price_drop', 'low_stock', 'system_maintenance')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."notifications_status_enum" AS ENUM('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."notifications_channel_enum" AS ENUM('email', 'sms', 'push', 'in_app')
    `);

    // Create tables
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'customer',
        "phone" character varying,
        "address" character varying,
        "city" character varying,
        "country" character varying,
        "postalCode" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "emailVerified" boolean NOT NULL DEFAULT false,
        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "nameEn" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" character varying,
        "allegroId" character varying,
        "allegroUrl" character varying,
        "level" integer NOT NULL DEFAULT '0',
        "productCount" integer NOT NULL DEFAULT '0',
        "hasProducts" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "subcategories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "nameEn" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" character varying,
        "allegroId" character varying,
        "allegroUrl" character varying,
        "level" integer NOT NULL DEFAULT '1',
        "productCount" integer NOT NULL DEFAULT '0',
        "hasProducts" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "categoryId" uuid,
        "parentId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subcategories" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" text,
        "allegroId" character varying,
        "allegroUrl" character varying,
        "price" numeric(10,2),
        "currency" character varying,
        "brand" character varying,
        "model" character varying,
        "year" character varying,
        "partNumber" character varying,
        "images" text,
        "specifications" json,
        "viewCount" integer NOT NULL DEFAULT '0',
        "isActive" boolean NOT NULL DEFAULT true,
        "inStock" boolean NOT NULL DEFAULT true,
        "categoryId" uuid,
        "subcategoryId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "lastScrapedAt" TIMESTAMP,
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "orderNumber" character varying NOT NULL,
        "userId" uuid NOT NULL,
        "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending',
        "subtotal" numeric(10,2) NOT NULL,
        "tax" numeric(10,2) NOT NULL DEFAULT '0',
        "shipping" numeric(10,2) NOT NULL DEFAULT '0',
        "total" numeric(10,2) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'EUR',
        "shippingFirstName" character varying NOT NULL,
        "shippingLastName" character varying NOT NULL,
        "shippingAddress" character varying NOT NULL,
        "shippingCity" character varying NOT NULL,
        "shippingPostalCode" character varying NOT NULL,
        "shippingCountry" character varying NOT NULL,
        "shippingPhone" character varying,
        "billingFirstName" character varying NOT NULL,
        "billingLastName" character varying NOT NULL,
        "billingAddress" character varying NOT NULL,
        "billingCity" character varying NOT NULL,
        "billingPostalCode" character varying NOT NULL,
        "billingCountry" character varying NOT NULL,
        "billingPhone" character varying,
        "notes" character varying,
        "trackingNumber" character varying,
        "shippingCarrier" character varying,
        "shippedAt" TIMESTAMP,
        "deliveredAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_orders_orderNumber" UNIQUE ("orderNumber"),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "unitPrice" numeric(10,2) NOT NULL,
        "totalPrice" numeric(10,2) NOT NULL,
        "productName" character varying,
        "productSku" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "paymentId" character varying NOT NULL,
        "orderId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending',
        "method" "public"."payments_method_enum" NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'EUR',
        "gatewayTransactionId" character varying,
        "gatewayResponse" character varying,
        "failureReason" character varying,
        "refundAmount" numeric,
        "refundReason" character varying,
        "refundedAt" TIMESTAMP,
        "processedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_payments_paymentId" UNIQUE ("paymentId"),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "orderId" uuid,
        "rating" integer NOT NULL DEFAULT '5',
        "title" character varying,
        "comment" text,
        "status" "public"."reviews_status_enum" NOT NULL DEFAULT 'pending',
        "isVerifiedPurchase" boolean NOT NULL DEFAULT false,
        "helpfulCount" integer NOT NULL DEFAULT '0',
        "moderatorNotes" character varying,
        "moderatedAt" TIMESTAMP,
        "moderatedBy" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "type" "public"."notifications_type_enum" NOT NULL,
        "channel" "public"."notifications_channel_enum" NOT NULL DEFAULT 'email',
        "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'pending',
        "subject" character varying NOT NULL,
        "message" text NOT NULL,
        "templateData" json,
        "templateId" character varying,
        "externalId" character varying,
        "recipient" character varying,
        "errorMessage" character varying,
        "retryCount" integer NOT NULL DEFAULT '0',
        "scheduledFor" TIMESTAMP,
        "sentAt" TIMESTAMP,
        "deliveredAt" TIMESTAMP,
        "openedAt" TIMESTAMP,
        "clickedAt" TIMESTAMP,
        "orderId" uuid,
        "productId" uuid,
        "paymentId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "subcategories" ADD CONSTRAINT "FK_subcategories_categoryId" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "subcategories" ADD CONSTRAINT "FK_subcategories_parentId" FOREIGN KEY ("parentId") REFERENCES "subcategories"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "products" ADD CONSTRAINT "FK_products_categoryId" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "products" ADD CONSTRAINT "FK_products_subcategoryId" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "order_items" ADD CONSTRAINT "FK_order_items_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_productId" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_orderId" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_categories_slug" ON "categories" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_products_slug" ON "products" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_userId" ON "orders" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_orderId" ON "payments" ("orderId")`);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_productId" ON "reviews" ("productId")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_status" ON "notifications" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_reviews_productId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_orderId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_products_slug"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_categories_slug"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_userId"`);
    await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_orderId"`);
    await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_productId"`);
    await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_userId"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_userId"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_orderId"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_productId"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_order_items_orderId"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_userId"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_subcategoryId"`);
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_categoryId"`);
    await queryRunner.query(`ALTER TABLE "subcategories" DROP CONSTRAINT "FK_subcategories_parentId"`);
    await queryRunner.query(`ALTER TABLE "subcategories" DROP CONSTRAINT "FK_subcategories_categoryId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "subcategories"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "public"."notifications_channel_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."reviews_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
