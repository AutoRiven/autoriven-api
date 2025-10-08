import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductEnhancedFields1728291000000 implements MigrationInterface {
  name = 'AddProductEnhancedFields1728291000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add descriptionHtml column for full HTML description
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN "descriptionHtml" text
    `);

    // Add galleryImages column for product image gallery
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN "galleryImages" text
    `);

    // Add EAN/GTIN column
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN "ean" varchar
    `);

    // Add seller information columns
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN "sellerName" varchar
    `);

    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN "sellerRating" decimal(3,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove sellerRating column
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN "sellerRating"
    `);

    // Remove sellerName column
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN "sellerName"
    `);

    // Remove ean column
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN "ean"
    `);

    // Remove galleryImages column
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN "galleryImages"
    `);

    // Remove descriptionHtml column
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN "descriptionHtml"
    `);
  }
}
