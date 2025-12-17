import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAiJobIdToRecitations1765900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'recitations',
      new TableColumn({
        name: 'ai_job_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'AI service job ID for tracking async evaluation processing',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('recitations', 'ai_job_id');
  }
}
