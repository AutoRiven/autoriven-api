import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductAutoRivenIdAndEnglishFields1728289000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add nameEn column to products
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "nameEn" varchar NULL
    `);

    // Add autoRivenId column to products (unique integer)
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "autoRivenId" integer NULL
    `);

    // Add englishSlug column to products
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "englishSlug" varchar NULL
    `);

    // Add englishUrl column to products
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "englishUrl" varchar NULL
    `);

    // Create unique index on autoRivenId
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_products_autoRivenId"
      ON "products" ("autoRivenId")
      WHERE "autoRivenId" IS NOT NULL
    `);

    console.log('✅ Added autoRivenId, nameEn, englishSlug, and englishUrl columns to products table');
    console.log('✅ Created unique index on products.autoRivenId');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unique index
    await queryRunner.query(`DROP INDEX "IDX_products_autoRivenId"`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "englishUrl"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "englishSlug"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "autoRivenId"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "nameEn"`);

    console.log('✅ Removed autoRivenId, nameEn, englishSlug, and englishUrl columns from products table');
  }
}
