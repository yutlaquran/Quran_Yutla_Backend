import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationSettingsFields1769000000000
  implements MigrationInterface
{
  name = 'AddApplicationSettingsFields1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "maintenance_mode" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "maintenance_message" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "allow_registration" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "min_app_version" character varying(20) NOT NULL DEFAULT '1.0.0'`,
    );

    await queryRunner.query(
      `UPDATE "app_settings" SET "maintenance_mode" = "enabled" WHERE "name" = 'application'`,
    );
    await queryRunner.query(
      `UPDATE "app_settings" SET "maintenance_message" = 'System is under maintenance.' WHERE "name" = 'application' AND "maintenance_message" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "min_app_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "allow_registration"`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "maintenance_message"`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" DROP COLUMN IF EXISTS "maintenance_mode"`,
    );
  }
}
