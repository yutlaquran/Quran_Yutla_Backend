import { MigrationInterface, QueryRunner } from "typeorm";

export class CheckPendingChanges1764811341628 implements MigrationInterface {
    name = 'CheckPendingChanges1764811341628'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_parent_id"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT '{guest}'`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_parent_id" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

}
