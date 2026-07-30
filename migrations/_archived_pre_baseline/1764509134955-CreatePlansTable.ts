import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePlansTable1764509134955 implements MigrationInterface {
    name = 'CreatePlansTable1764509134955'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."plans_session_duration_enum" AS ENUM('30', '60')`);
        await queryRunner.query(`CREATE TYPE "public"."plans_session_count_enum" AS ENUM('8', '12', '16', '20', '24')`);
        await queryRunner.query(`CREATE TABLE "plans" ("id" SERIAL NOT NULL, "name_en" character varying(100) NOT NULL, "name_ar" character varying(100) NOT NULL, "description_en" text, "description_ar" text, "session_duration" "public"."plans_session_duration_enum" NOT NULL, "session_count" "public"."plans_session_count_enum" NOT NULL, "base_price" numeric(10,2) NOT NULL, "country_pricing" jsonb, "discount_percentage" numeric(5,2) NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "is_popular" boolean NOT NULL DEFAULT false, "display_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id")); COMMENT ON COLUMN "plans"."session_duration" IS 'Duration of each session in minutes (30 or 60)'; COMMENT ON COLUMN "plans"."session_count" IS 'Number of sessions per month (8, 12, 16, 20, 24)'; COMMENT ON COLUMN "plans"."base_price" IS 'Base price in USD'; COMMENT ON COLUMN "plans"."country_pricing" IS 'Country-specific pricing: { "EG": 500, "SA": 200, "AE": 150 }'; COMMENT ON COLUMN "plans"."discount_percentage" IS 'Discount percentage (0-100)'; COMMENT ON COLUMN "plans"."is_popular" IS 'Mark as popular/recommended plan'; COMMENT ON COLUMN "plans"."display_order" IS 'Order for displaying plans (lower = higher priority)'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "plans"`);
        await queryRunner.query(`DROP TYPE "public"."plans_session_count_enum"`);
        await queryRunner.query(`DROP TYPE "public"."plans_session_duration_enum"`);
    }

}
