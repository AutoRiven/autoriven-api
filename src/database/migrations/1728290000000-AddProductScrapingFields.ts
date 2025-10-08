import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductScrapingFields1728290000000 implements MigrationInterface {
  name = 'AddProductScrapingFields1728290000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add manufacturer column
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN "manufacturer" varchar
    `);

    // Add condition column
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN "condition" varchar
    `);

    // Add rating column
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN "rating" decimal(3,2)
    `);

    // Add reviewCount column
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN "reviewCount" integer DEFAULT 0
    `);

    // Add freeDelivery column
    await queryRunner.query(`
      ALTER TABLE "products" 
      ADD COLUMN "freeDelivery" boolean DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove freeDelivery column
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN "freeDelivery"
    `);

    // Remove reviewCount column
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN "reviewCount"
    `);

    // Remove rating column
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN "rating"
    `);

    // Remove condition column
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN "condition"
    `);

    // Remove manufacturer column
    await queryRunner.query(`
      ALTER TABLE "products" 
      DROP COLUMN "manufacturer"
    `);
  }
}
