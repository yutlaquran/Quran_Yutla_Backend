import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentFields1733864000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add durationDays to plans table
    await queryRunner.query(`
      ALTER TABLE "plans" 
      ADD COLUMN IF NOT EXISTS "duration_days" integer NOT NULL DEFAULT 30
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "plans"."duration_days" IS 'Plan duration in days (default: 30 for monthly)'
    `);

    // Add transactionId to subscriptions table
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      ADD COLUMN IF NOT EXISTS "transaction_id" varchar(255)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "subscriptions"."transaction_id" IS 'Payment transaction ID from payment gateway'
    `);

    // Create index on transaction_id for faster lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscriptions_transaction_id" 
      ON "subscriptions" ("transaction_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_subscriptions_transaction_id"
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "subscriptions" 
      DROP COLUMN IF EXISTS "transaction_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "plans" 
      DROP COLUMN IF EXISTS "duration_days"
    `);
  }
}
