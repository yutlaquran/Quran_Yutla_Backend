import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Optional seeder for the 4 review/demo accounts (student, parent, teacher,
 * admin), used by the review committee. It runs on boot ONLY when
 * `SEED_REVIEW_ACCOUNTS=true`, so a normal production start does nothing.
 *
 * Idempotent: it deletes any previous demo accounts (by email) and recreates
 * them with a fresh active subscription and the parent/teacher links, so it is
 * safe to leave the flag on across restarts during the review, and safe to turn
 * off (and delete the accounts) afterwards.
 *
 * Password for all four: Quran@2026
 */
@Injectable()
export class ReviewAccountsSeeder implements OnModuleInit {
  private readonly logger = new Logger(ReviewAccountsSeeder.name);
  private static readonly PASSWORD = 'Quran@2026';

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    if (process.env.SEED_REVIEW_ACCOUNTS !== 'true') {
      return;
    }
    try {
      const hash = await bcrypt.hash(ReviewAccountsSeeder.PASSWORD, 10);
      await this.dataSource.query(this.buildSeedSql(hash));
      this.logger.warn(
        'Review/demo accounts seeded (SEED_REVIEW_ACCOUNTS=true). ' +
          'Turn the flag off and remove the accounts once the review is done.',
      );
    } catch (error) {
      // Never let seeding take the app down — just log it.
      this.logger.error(
        `Review-account seeding failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Mirrors review-accounts/seed-review-accounts.sql. The bcrypt hash is
   * generated at runtime, so no credential hash is committed in code.
   */
  private buildSeedSql(pwHash: string): string {
    return `DO $do$
DECLARE
  pw         text := '${pwHash}';
  v_student  int;
  v_parent   int;
  v_teacher  int;
  v_admin    int;
  v_plan     int;
BEGIN
  -- Clear join rows first: teacher_students.student_id has no ON DELETE
  -- CASCADE, so it would otherwise block deleting the demo users on re-run.
  DELETE FROM teacher_students
   WHERE teacher_id IN (SELECT id FROM users WHERE email LIKE '%.demo@quranyutla.com')
      OR student_id IN (SELECT id FROM users WHERE email LIKE '%.demo@quranyutla.com');
  DELETE FROM users WHERE email LIKE '%.demo@quranyutla.com';

  INSERT INTO users (email, password, full_name, phone_number, "isEmailVerified",
                     roles, student_code, country, age_group, gender, status)
  VALUES ('student.demo@quranyutla.com', pw, 'طالب المراجعة', '+201000000101', true,
          '{student}', '900101', 'Egypt', '18+', 'male', 'active')
  RETURNING id INTO v_student;

  INSERT INTO users (email, password, full_name, phone_number, "isEmailVerified",
                     roles, number_of_children, status)
  VALUES ('parent.demo@quranyutla.com', pw, 'ولي أمر المراجعة', '+201000000102', true,
          '{parent}', 1, 'active')
  RETURNING id INTO v_parent;

  INSERT INTO users (email, password, full_name, phone_number, "isEmailVerified",
                     roles, status)
  VALUES ('teacher.demo@quranyutla.com', pw, 'معلم المراجعة', '+201000000103', true,
          '{teacher}', 'active')
  RETURNING id INTO v_teacher;

  INSERT INTO users (email, password, full_name, phone_number, "isEmailVerified",
                     roles, status)
  VALUES ('admin.demo@quranyutla.com', pw, 'مدير المراجعة', '+201000000104', true,
          '{admin}', 'active')
  RETURNING id INTO v_admin;

  UPDATE users SET parent_id = v_parent WHERE id = v_student;
  INSERT INTO teacher_students (teacher_id, student_id)
  VALUES (v_teacher, v_student), (v_student, v_teacher)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_plan FROM plans ORDER BY id LIMIT 1;
  IF v_plan IS NULL THEN
    INSERT INTO plans (name_en, name_ar, session_duration, session_count, base_price)
    VALUES ('Review Plan', 'باقة المراجعة',
      (SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
       WHERE t.typname = 'plans_session_duration_enum' ORDER BY e.enumsortorder LIMIT 1)::plans_session_duration_enum,
      (SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
       WHERE t.typname = 'plans_session_count_enum' ORDER BY e.enumsortorder LIMIT 1)::plans_session_count_enum,
      0)
    RETURNING id INTO v_plan;
  END IF;

  INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date,
                             total_sessions, remaining_sessions, session_duration)
  VALUES (v_student, v_plan, 'active', NOW(), NOW() + INTERVAL '365 days',
          100, 100, 30);
END
$do$;`;
  }
}
