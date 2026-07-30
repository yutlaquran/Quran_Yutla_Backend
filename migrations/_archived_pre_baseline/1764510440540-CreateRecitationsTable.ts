import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRecitationsTable1764510440540 implements MigrationInterface {
    name = 'CreateRecitationsTable1764510440540'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."recitations_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "recitations" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "surah_id" integer NOT NULL, "from_ayah" integer NOT NULL, "to_ayah" integer NOT NULL, "audio_url" character varying(500) NOT NULL, "audio_key" character varying(500) NOT NULL, "duration" integer NOT NULL, "file_size" bigint NOT NULL, "status" "public"."recitations_status_enum" NOT NULL DEFAULT 'pending', "evaluation_score" numeric(5,2), "evaluation_data" jsonb, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5b748992dfbaf0aa61e58c8d362" PRIMARY KEY ("id")); COMMENT ON COLUMN "recitations"."audio_key" IS 'S3 object key for deletion'; COMMENT ON COLUMN "recitations"."duration" IS 'Duration in seconds'; COMMENT ON COLUMN "recitations"."file_size" IS 'File size in bytes'; COMMENT ON COLUMN "recitations"."evaluation_score" IS 'AI evaluation score (0-100)'; COMMENT ON COLUMN "recitations"."evaluation_data" IS 'Detailed AI evaluation results'`);
        await queryRunner.query(`ALTER TABLE "recitations" ADD CONSTRAINT "FK_354b9ea0ab74c74ad7e0d331585" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recitations" DROP CONSTRAINT "FK_354b9ea0ab74c74ad7e0d331585"`);
        await queryRunner.query(`DROP TABLE "recitations"`);
        await queryRunner.query(`DROP TYPE "public"."recitations_status_enum"`);
    }

}
