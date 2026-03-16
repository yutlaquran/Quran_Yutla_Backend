import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddUserDeleteCascades1768000000000
  implements MigrationInterface
{
  name = 'AddUserDeleteCascades1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.replaceUserForeignKey(
      queryRunner,
      'email_verifications',
      ['userId'],
      'CASCADE',
    );
    await this.replaceUserForeignKey(
      queryRunner,
      'notification_recipients',
      ['userId'],
      'CASCADE',
    );
    await this.replaceUserForeignKey(
      queryRunner,
      'teacher_students',
      ['teacher_id'],
      'CASCADE',
    );
    await this.replaceUserForeignKey(
      queryRunner,
      'teacher_students',
      ['student_id'],
      'CASCADE',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.replaceUserForeignKey(
      queryRunner,
      'email_verifications',
      ['userId'],
      'NO ACTION',
    );
    await this.replaceUserForeignKey(
      queryRunner,
      'notification_recipients',
      ['userId'],
      'NO ACTION',
    );
    await this.replaceUserForeignKey(
      queryRunner,
      'teacher_students',
      ['teacher_id'],
      'NO ACTION',
    );
    await this.replaceUserForeignKey(
      queryRunner,
      'teacher_students',
      ['student_id'],
      'NO ACTION',
    );
  }

  private async replaceUserForeignKey(
    queryRunner: QueryRunner,
    tableName: string,
    columnNames: string[],
    onDelete: 'CASCADE' | 'NO ACTION',
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);

    if (!table) {
      return;
    }

    const foreignKey = table.foreignKeys.find(
      (candidate) =>
        candidate.referencedTableName === 'users' &&
        candidate.columnNames.length === columnNames.length &&
        candidate.columnNames.every((columnName, index) => columnName === columnNames[index]),
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey(tableName, foreignKey);
    }

    await queryRunner.createForeignKey(
      tableName,
      new TableForeignKey({
        name: foreignKey?.name,
        columnNames,
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete,
        onUpdate: foreignKey?.onUpdate || 'NO ACTION',
      }),
    );
  }
}