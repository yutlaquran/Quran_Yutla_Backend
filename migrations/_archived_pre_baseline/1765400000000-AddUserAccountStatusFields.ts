import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAccountStatusFields1765400000000
  implements MigrationInterface
{
  name = 'AddUserAccountStatusFields1765400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_status_enum') THEN
          CREATE TYPE "users_status_enum" AS ENUM (
            'active',
            'suspended',
            'pending',
            'blocked',
            'deleted',
            'verified',
            'unverified',
            'refused',
            'expired'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "status" "users_status_enum" NOT NULL DEFAULT 'active'
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "suspended_at" TIMESTAMPTZ NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "suspended_reason" TEXT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "suspended_by_admin_id" INTEGER NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.constraint_column_usage
          WHERE table_name = 'users'
            AND constraint_name = 'FK_users_suspended_by_admin'
        ) THEN
          ALTER TABLE "users"
          ADD CONSTRAINT "FK_users_suspended_by_admin"
          FOREIGN KEY ("suspended_by_admin_id")
          REFERENCES "users"("id")
          ON DELETE SET NULL
          ON UPDATE CASCADE;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP CONSTRAINT IF EXISTS "FK_users_suspended_by_admin"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "suspended_by_admin_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "suspended_reason"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "suspended_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "status"
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_status_enum') THEN
          DROP TYPE "users_status_enum";
        END IF;
      END$$;
    `);
  }
}
