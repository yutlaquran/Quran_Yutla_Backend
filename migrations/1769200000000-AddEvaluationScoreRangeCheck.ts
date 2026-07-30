import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `teacher_evaluation_score` has had a 0-100 range check since
 * 1734470000000-AddTeacherEvaluationFields. The AI-produced
 * `evaluation_score` never got the same treatment, so the column accepted
 * anything numeric(5,2) could hold — up to 999.99, and negatives.
 *
 * NOTE: this catches out-of-range values only. It does NOT catch an AI service
 * that reports accuracy as a 0.0-1.0 ratio instead of a 0-100 percentage,
 * because 0.95 is a legal value in this range. That mismatch is detected at
 * runtime in RecitationsService.handleAIWebhook, which normalises and logs a
 * warning.
 */
export class AddEvaluationScoreRangeCheck1769200000000
  implements MigrationInterface
{
  name = 'AddEvaluationScoreRangeCheck1769200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clamp any pre-existing out-of-range rows, otherwise ADD CONSTRAINT fails
    // on a table that already violates it.
    await queryRunner.query(`
      UPDATE "recitations"
      SET "evaluation_score" = NULL
      WHERE "evaluation_score" IS NOT NULL
        AND ("evaluation_score" < 0 OR "evaluation_score" > 100)
    `);

    await queryRunner.query(`
      ALTER TABLE "recitations"
      DROP CONSTRAINT IF EXISTS "CHK_evaluation_score_range"
    `);

    await queryRunner.query(`
      ALTER TABLE "recitations"
      ADD CONSTRAINT "CHK_evaluation_score_range"
      CHECK ("evaluation_score" IS NULL OR ("evaluation_score" >= 0 AND "evaluation_score" <= 100))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "recitations"
      DROP CONSTRAINT IF EXISTS "CHK_evaluation_score_range"
    `);
  }
}
