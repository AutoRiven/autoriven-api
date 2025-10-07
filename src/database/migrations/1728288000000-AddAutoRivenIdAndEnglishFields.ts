import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAutoRivenIdAndEnglishFields1728288000000 implements MigrationInterface {
    name = 'AddAutoRivenIdAndEnglishFields1728288000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to categories table
        await queryRunner.query(`
            ALTER TABLE "categories" 
            ADD COLUMN IF NOT EXISTS "autoRivenId" integer,
            ADD COLUMN IF NOT EXISTS "englishSlug" varchar,
            ADD COLUMN IF NOT EXISTS "englishUrl" varchar
        `);

        // Add new columns to subcategories table
        await queryRunner.query(`
            ALTER TABLE "subcategories" 
            ADD COLUMN IF NOT EXISTS "autoRivenId" integer,
            ADD COLUMN IF NOT EXISTS "englishSlug" varchar,
            ADD COLUMN IF NOT EXISTS "englishUrl" varchar
        `);

        // Create unique constraint on autoRivenId for categories
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_categories_autoRivenId" 
            ON "categories" ("autoRivenId") 
            WHERE "autoRivenId" IS NOT NULL
        `);

        // Create unique constraint on autoRivenId for subcategories
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_subcategories_autoRivenId" 
            ON "subcategories" ("autoRivenId") 
            WHERE "autoRivenId" IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop unique constraints
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_categories_autoRivenId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subcategories_autoRivenId"`);

        // Remove columns from categories table
        await queryRunner.query(`
            ALTER TABLE "categories" 
            DROP COLUMN IF EXISTS "autoRivenId",
            DROP COLUMN IF EXISTS "englishSlug",
            DROP COLUMN IF EXISTS "englishUrl"
        `);

        // Remove columns from subcategories table
        await queryRunner.query(`
            ALTER TABLE "subcategories" 
            DROP COLUMN IF EXISTS "autoRivenId",
            DROP COLUMN IF EXISTS "englishSlug",
            DROP COLUMN IF EXISTS "englishUrl"
        `);
    }
}
