import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherEvaluationFields1734470000000
  implements MigrationInterface
{
  name = 'AddTeacherEvaluationFields1734470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add teacher evaluation score column
    await queryRunner.query(`
      ALTER TABLE "recitations" 
      ADD COLUMN IF NOT EXISTS "teacher_evaluation_score" DECIMAL(5,2)
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "recitations"."teacher_evaluation_score" 
      IS 'Manual teacher evaluation score (0-100)'
    `);

    // Add teacher notes column
    await queryRunner.query(`
      ALTER TABLE "recitations" 
      ADD COLUMN IF NOT EXISTS "teacher_notes" TEXT
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "recitations"."teacher_notes" 
      IS 'Teacher notes and feedback'
    `);

    // Add evaluated by teacher ID column
    await queryRunner.query(`
      ALTER TABLE "recitations" 
      ADD COLUMN IF NOT EXISTS "evaluated_by_teacher_id" INTEGER
    `);

    // Add teacher evaluated at timestamp column
    await queryRunner.query(`
      ALTER TABLE "recitations" 
      ADD COLUMN IF NOT EXISTS "teacher_evaluated_at" TIMESTAMPTZ
    `);

    // Add foreign key constraint for teacher
    await queryRunner.query(`
      ALTER TABLE "recitations" 
      ADD CONSTRAINT "FK_recitations_evaluated_by_teacher" 
      FOREIGN KEY ("evaluated_by_teacher_id") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `);

    // Add check constraint for score range
    await queryRunner.query(`
      ALTER TABLE "recitations" 
      ADD CONSTRAINT "CHK_teacher_evaluation_score_range" 
      CHECK ("teacher_evaluation_score" IS NULL OR ("teacher_evaluation_score" >= 0 AND "teacher_evaluation_score" <= 100))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop constraints
    await queryRunner.query(`
      ALTER TABLE "recitations" 
      DROP CONSTRAINT IF EXISTS "CHK_teacher_evaluation_score_range"
    `);

    await queryRunner.query(`
      ALTER TABLE "recitations" 
      DROP CONSTRAINT IF EXISTS "FK_recitations_evaluated_by_teacher"
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "recitations" 
      DROP COLUMN IF EXISTS "teacher_evaluated_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "recitations" 
      DROP COLUMN IF EXISTS "evaluated_by_teacher_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "recitations" 
      DROP COLUMN IF EXISTS "teacher_notes"
    `);

    await queryRunner.query(`
      ALTER TABLE "recitations" 
      DROP COLUMN IF EXISTS "teacher_evaluation_score"
    `);
  }
}
