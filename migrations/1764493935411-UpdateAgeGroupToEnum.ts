import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAgeGroupToEnum1764493935411 implements MigrationInterface {
    name = 'UpdateAgeGroupToEnum1764493935411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes only if they exist
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_ayahs_surah_number"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_ayahs_juz"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_ayahs_page"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_ayahs_number"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "age_group"`);
        await queryRunner.query(`CREATE TYPE "public"."users_age_group_enum" AS ENUM('4-6', '7-12', '13-17', '18+')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "age_group" "public"."users_age_group_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "age_group"`);
        await queryRunner.query(`DROP TYPE "public"."users_age_group_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "age_group" character varying`);
        await queryRunner.query(`CREATE INDEX "idx_ayahs_number" ON "ayahs" ("number") `);
        await queryRunner.query(`CREATE INDEX "idx_ayahs_page" ON "ayahs" ("page") `);
        await queryRunner.query(`CREATE INDEX "idx_ayahs_juz" ON "ayahs" ("juz") `);
        await queryRunner.query(`CREATE INDEX "idx_ayahs_surah_number" ON "ayahs" ("surah_number") `);
    }

}
