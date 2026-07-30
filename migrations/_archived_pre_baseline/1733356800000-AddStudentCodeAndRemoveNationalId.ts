import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentCodeAndRemoveNationalId1733356800000
  implements MigrationInterface
{
  name = 'AddStudentCodeAndRemoveNationalId1733356800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add student_code column
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "student_code" VARCHAR(6) UNIQUE
    `);

    // Add parent_id column if not exists
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "parent_id" INTEGER
    `);

    // Add foreign key constraint for parent_id
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_parent_id" 
      FOREIGN KEY ("parent_id") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `);

    // Drop national_id column
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "national_id"
    `);

    // Drop national_image_url column
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "national_image_url"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add national_id column
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "national_id" VARCHAR(20) UNIQUE
    `);

    // Re-add national_image_url column
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "national_image_url" VARCHAR
    `);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP CONSTRAINT IF EXISTS "FK_users_parent_id"
    `);

    // Drop parent_id column
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "parent_id"
    `);

    // Drop student_code column
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "student_code"
    `);
  }
}
