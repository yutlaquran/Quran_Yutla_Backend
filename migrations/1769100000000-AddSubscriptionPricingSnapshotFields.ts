import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionPricingSnapshotFields1769100000000
  implements MigrationInterface
{
  name = 'AddSubscriptionPricingSnapshotFields1769100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "pricing_country" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "original_price" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "discount_percentage_applied" numeric(5,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "final_amount" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "currency" character varying(10)`,
    );

    await queryRunner.query(
      `COMMENT ON COLUMN "subscriptions"."pricing_country" IS 'Country used for price resolution at payment initiation'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "subscriptions"."original_price" IS 'Resolved country/base plan price before discount'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "subscriptions"."discount_percentage_applied" IS 'Discount percentage applied at payment initiation'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "subscriptions"."final_amount" IS 'Final amount charged after discount at payment initiation'`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "subscriptions"."currency" IS 'Currency used for payment charge'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "currency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "final_amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "discount_percentage_applied"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "original_price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "pricing_country"`,
    );
  }
}
