import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubscriptionsTable1764510103400 implements MigrationInterface {
    name = 'CreateSubscriptionsTable1764510103400'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'expired', 'cancelled', 'pending_payment')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "plan_id" integer NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'pending_payment', "start_date" TIMESTAMP, "end_date" TIMESTAMP, "total_sessions" integer NOT NULL, "remaining_sessions" integer NOT NULL, "session_duration" integer NOT NULL, "auto_renew" boolean NOT NULL DEFAULT true, "payment_method" character varying(50), "last_payment_date" TIMESTAMP, "next_billing_date" TIMESTAMP, "cancelled_at" TIMESTAMP, "cancellation_reason" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id")); COMMENT ON COLUMN "subscriptions"."total_sessions" IS 'Total sessions from plan (8, 12, 16, 20, 24)'; COMMENT ON COLUMN "subscriptions"."remaining_sessions" IS 'Sessions remaining this month'; COMMENT ON COLUMN "subscriptions"."session_duration" IS 'Duration per session in minutes (30 or 60)'; COMMENT ON COLUMN "subscriptions"."auto_renew" IS 'Auto-renew subscription monthly'`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    }

}
