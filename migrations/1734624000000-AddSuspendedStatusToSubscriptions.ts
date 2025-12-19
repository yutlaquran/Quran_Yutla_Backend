import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuspendedStatusToSubscriptions1734624000000 implements MigrationInterface {
    name = 'AddSuspendedStatusToSubscriptions1734624000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add 'suspended' to the enum type
        await queryRunner.query(`ALTER TYPE "public"."subscriptions_status_enum" ADD VALUE IF NOT EXISTS 'suspended'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
        // This would require recreating the enum type, which is complex
        // For production, you would need to handle this carefully
        console.log('Cannot remove enum value in PostgreSQL. Manual intervention required.');
    }
}
