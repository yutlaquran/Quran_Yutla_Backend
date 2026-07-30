import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as supertest from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { FileUploadService } from '../src/common/fileUpload/fileUpload.service';
import { ServerEmailService } from '../src/common/email/email.service';

const request = (supertest as any).default || supertest;
const API = '/api/v1';
const PW = 'Password@123';
const SFX = Date.now().toString().slice(-7);
const email = (role: string) => `e2e-${role}-${SFX}@test.local`;

// Never touch OVH S3 in tests: replace the storage layer with an in-memory stub.
const storageMock = {
  processAndSaveFile: jest
    .fn()
    .mockResolvedValue({ url: '/recitations/e2e-mock.webm', filename: 'e2e-mock.webm', size: 1024 }),
  processAndSaveFiles: jest.fn().mockResolvedValue([]),
  processCsvFile: jest.fn(),
  deleteFile: jest.fn().mockResolvedValue(undefined),
};

// Never send real emails during tests. Signup would otherwise fire a real
// verification email per created user. Explicit methods only — a catch-all
// Proxy would answer `.then` and make Nest treat the mock as a Promise.
const emailServiceMock = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

describe('Recitations & Auth (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;

  const WEBHOOK_SECRET = process.env.AI_WEBHOOK_SECRET || '';
  const users: Record<string, { id: number; token: string; email: string; studentCode?: string }> = {};
  let planId: number;
  let recitationId: number;
  const createdUserIds: number[] = [];

  const http = () => request(app.getHttpServer());
  // The RolesGuard denies a wrong-role (but authenticated) request with 401
  // rather than the more conventional 403. Either way the request is *denied*,
  // which is all these guards need to prove — so accept both.
  const DENIED = [401, 403];
  let phoneSeq = 0;
  const phone = () => `+2010${SFX}${(phoneSeq++).toString().padStart(2, '0')}`;

  const registerStudent = (mail: string, name: string) =>
    http().post(`${API}/auth/sign-up`).send({
      email: mail,
      fullName: name,
      phoneNumber: phone(),
      country: 'Egypt',
      ageGroup: '18+',
      gender: 'male',
      password: PW,
    });

  async function verifyAndLogin(mail: string, extraRoles?: string) {
    await ds.query(
      `UPDATE users SET "isEmailVerified" = true${extraRoles ? `, roles = '{${extraRoles}}'` : ''} WHERE email = $1`,
      [mail],
    );
    const login = await http().post(`${API}/auth/login`).send({ identifier: mail, password: PW });
    const row = await ds.query(`SELECT id, student_code FROM users WHERE email = $1`, [mail]);
    createdUserIds.push(row[0].id);
    return { id: row[0].id, studentCode: row[0].student_code, token: login.body?.data?.accessToken };
  }

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FileUploadService)
      .useValue(storageMock)
      .overrideProvider(ServerEmailService) // never send real emails in tests
      .useValue(emailServiceMock)
      .overrideGuard(ThrottlerGuard) // avoid flaky 429s during the run
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    // Mirror src/main.ts so routes & validation behave exactly like production.
    app.enableVersioning({ type: VersioningType.URI, prefix: 'api/v' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    ds = moduleRef.get(DataSource);

    // --- student (main) ---
    await registerStudent(email('student'), 'E2E Student');
    users.student = { email: email('student'), ...(await verifyAndLogin(email('student'))) };

    // --- child student (for parent linking) ---
    await registerStudent(email('child'), 'E2E Child');
    users.child = { email: email('child'), ...(await verifyAndLogin(email('child'))) };

    // --- teacher ---
    await http().post(`${API}/auth/sign-up/teacher`).send({
      email: email('teacher'),
      name: 'E2E Teacher',
      phoneNumber: phone(),
      type: 'quran_teacher',
      password: PW,
    });
    users.teacher = { email: email('teacher'), ...(await verifyAndLogin(email('teacher'))) };

    // --- admin (register as student, then promote via DB) ---
    await registerStudent(email('admin'), 'E2E Admin');
    users.admin = { email: email('admin'), ...(await verifyAndLogin(email('admin'), 'admin')) };

    // --- parent (needs an existing student code) ---
    await http().post(`${API}/auth/sign-up/parent`).send({
      email: email('parent'),
      fullName: 'E2E Parent',
      phoneNumber: phone(),
      numberOfChildren: 1,
      studentCodes: [users.child.studentCode],
      password: PW,
    });
    users.parent = { email: email('parent'), ...(await verifyAndLogin(email('parent'))) };

    // --- relationships ---
    await ds.query(`UPDATE users SET parent_id = $1 WHERE id = $2`, [users.parent.id, users.child.id]);
    await ds.query(
      `INSERT INTO teacher_students (teacher_id, student_id) VALUES ($1, $2), ($1, $3) ON CONFLICT DO NOTHING`,
      [users.teacher.id, users.student.id, users.child.id],
    );

    // --- plan + active subscriptions so the student can record ---
    const enumVal = (typename: string) =>
      `(SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = '${typename}' ORDER BY e.enumsortorder LIMIT 1)::${typename}`;
    const plan = await ds.query(
      `INSERT INTO plans (name_en, name_ar, session_duration, session_count, base_price)
       VALUES ('E2E Plan', 'خطة اختبار',
               ${enumVal('plans_session_duration_enum')},
               ${enumVal('plans_session_count_enum')}, 100)
       RETURNING id`,
    );
    planId = plan[0].id;
    await ds.query(
      `INSERT INTO subscriptions
         (user_id, plan_id, status, start_date, end_date, total_sessions, remaining_sessions, session_duration)
       VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '30 days', 10, 10, 30),
              ($3, $2, 'active', NOW(), NOW() + INTERVAL '30 days', 10, 10, 30)`,
      [users.student.id, planId, users.child.id],
    );
  });

  afterAll(async () => {
    if (ds?.isInitialized) {
      // Scoped teardown — only the rows this suite created. NEVER `WHERE 1=1`.
      await ds.query(`DELETE FROM recitations WHERE user_id = ANY($1)`, [createdUserIds]);
      await ds.query(`DELETE FROM subscriptions WHERE user_id = ANY($1)`, [createdUserIds]);
      await ds.query(`DELETE FROM teacher_students WHERE teacher_id = ANY($1) OR student_id = ANY($1)`, [createdUserIds]);
      if (planId) await ds.query(`DELETE FROM plans WHERE id = $1`, [planId]);
      await ds.query(`UPDATE users SET parent_id = NULL WHERE parent_id = ANY($1)`, [createdUserIds]);
      await ds.query(`DELETE FROM users WHERE id = ANY($1)`, [createdUserIds]);
    }
    await app?.close();
  });

  // ---------------- AUTH ----------------
  describe('Auth', () => {
    it('login returns a token for verified users', () => {
      expect(users.student.token).toBeTruthy();
      expect(users.admin.token).toBeTruthy();
    });
    it('GET /auth/get-me (student) -> 200', () =>
      http().get(`${API}/auth/get-me`).set('Authorization', `Bearer ${users.student.token}`).expect(200));
    it('GET /auth/get-me (no token) -> 401', () => http().get(`${API}/auth/get-me`).expect(401));
    it('login with wrong password -> 400', () =>
      http().post(`${API}/auth/login`).send({ identifier: users.student.email, password: 'Wrong@123' }).expect(400));
  });

  // ---------------- RECITATIONS: reads & role guards ----------------
  describe('Recitations reads', () => {
    it('GET /recitations/me (student) -> 200', async () => {
      const res = await http().get(`${API}/recitations/me`).set('Authorization', `Bearer ${users.student.token}`).expect(200);
      expect(res.body.success).toBe(true);
    });
    it('GET /recitations/me/statistics (student) -> 200', () =>
      http().get(`${API}/recitations/me/statistics`).set('Authorization', `Bearer ${users.student.token}`).expect(200));
    it('GET /recitations/me (teacher) -> denied', async () => {
      const res = await http().get(`${API}/recitations/me`).set('Authorization', `Bearer ${users.teacher.token}`);
      expect(DENIED).toContain(res.status);
    });
    it('GET /recitations/me (no token) -> 401', () => http().get(`${API}/recitations/me`).expect(401));
  });

  // ---------------- RECITATIONS: record-direct (storage mocked) ----------------
  describe('POST /recitations/record-direct', () => {
    it('student records successfully -> 201', async () => {
      const res = await http()
        .post(`${API}/recitations/record-direct`)
        .set('Authorization', `Bearer ${users.student.token}`)
        .field('surahId', '1')
        .field('fromAyah', '1')
        .field('toAyah', '7')
        .field('audioFormat', 'webm')
        .attach('audioBlob', Buffer.alloc(2048), { filename: 'rec.webm', contentType: 'audio/webm' })
        .expect(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.surahId).toBe(1);
      recitationId = res.body.data.id;
    });
    it('missing audioBlob -> 400', () =>
      http()
        .post(`${API}/recitations/record-direct`)
        .set('Authorization', `Bearer ${users.student.token}`)
        .field('surahId', '1')
        .field('fromAyah', '1')
        .field('toAyah', '7')
        .expect(400));
    it('parent role -> denied', async () => {
      const res = await http()
        .post(`${API}/recitations/record-direct`)
        .set('Authorization', `Bearer ${users.parent.token}`)
        .field('surahId', '1')
        .field('fromAyah', '1')
        .field('toAyah', '7')
        .attach('audioBlob', Buffer.alloc(1024), { filename: 'rec.webm', contentType: 'audio/webm' });
      expect(DENIED).toContain(res.status);
    });
  });

  // ---------------- RECITATIONS: by id / admin / relations ----------------
  describe('Recitations by id & relations', () => {
    it('GET /recitations/:id (owner) -> 200', () =>
      http().get(`${API}/recitations/${recitationId}`).set('Authorization', `Bearer ${users.student.token}`).expect(200));
    it('GET /recitations/999999 -> 404', () =>
      http().get(`${API}/recitations/999999`).set('Authorization', `Bearer ${users.student.token}`).expect(404));
    it('GET /recitations/admin/:id (admin) -> 200', () =>
      http().get(`${API}/recitations/admin/${recitationId}`).set('Authorization', `Bearer ${users.admin.token}`).expect(200));
    it('GET /recitations/admin/:id (student) -> denied', async () => {
      const res = await http().get(`${API}/recitations/admin/${recitationId}`).set('Authorization', `Bearer ${users.student.token}`);
      expect(DENIED).toContain(res.status);
    });
    it('GET /recitations/teacher/students (teacher) -> 200', () =>
      http().get(`${API}/recitations/teacher/students`).set('Authorization', `Bearer ${users.teacher.token}`).expect(200));
    it('GET /recitations/parent/children (parent) -> 200', () =>
      http().get(`${API}/recitations/parent/children`).set('Authorization', `Bearer ${users.parent.token}`).expect(200));
  });

  // ---------------- AI WEBHOOK ----------------
  describe('POST /recitations/webhook/ai-evaluation', () => {
    it('no auth -> 401', () =>
      http()
        .post(`${API}/recitations/webhook/ai-evaluation`)
        .send({ jobId: 'x', recitationId: 1, userId: 1, status: 'success', data: {} })
        .expect(401));
    it('wrong secret -> 401', () =>
      http()
        .post(`${API}/recitations/webhook/ai-evaluation`)
        .set('Authorization', 'Bearer wrong-secret')
        .send({ jobId: 'x', recitationId: 1, userId: 1, status: 'success', data: {} })
        .expect(401));

    const maybe = WEBHOOK_SECRET ? it : it.skip;
    maybe('valid secret, unknown recitation -> 404', () =>
      http()
        .post(`${API}/recitations/webhook/ai-evaluation`)
        .set('Authorization', `Bearer ${WEBHOOK_SECRET}`)
        .send({ jobId: 'no-such-job', recitationId: 999999, userId: 1, status: 'success', data: {} })
        .expect(404));
    maybe('valid secret, matching job -> stores 0-100 score', async () => {
      const jobId = `e2e-job-${SFX}`;
      await ds.query(`UPDATE recitations SET ai_job_id = $1 WHERE id = $2`, [jobId, recitationId]);
      const res = await http()
        .post(`${API}/recitations/webhook/ai-evaluation`)
        .set('Authorization', `Bearer ${WEBHOOK_SECRET}`)
        .send({
          jobId,
          recitationId,
          userId: users.student.id,
          status: 'success',
          data: { overallScore: 87.5, totalWords: 8, correctWords: 7, incorrectWords: 1 },
        });
      // POST defaults to 201; the AI team accepts any status < 400 as success.
      expect([200, 201]).toContain(res.status);
      const row = await ds.query(`SELECT status, evaluation_score FROM recitations WHERE id = $1`, [recitationId]);
      expect(Number(row[0].evaluation_score)).toBe(87.5);
      expect(row[0].status).toBe('completed');
    });
  });

  // ---------------- USER endpoints: locks in the authorization fix ----------------
  describe('User authorization (regression guard)', () => {
    it('GET /user (no token) -> 401', () => http().get(`${API}/user`).expect(401));
    it('GET /user (admin) -> 200', () =>
      http().get(`${API}/user`).set('Authorization', `Bearer ${users.admin.token}`).expect(200));
    it('GET /user (student) -> denied', async () => {
      const res = await http().get(`${API}/user`).set('Authorization', `Bearer ${users.student.token}`);
      expect(DENIED).toContain(res.status);
    });
    it('GET /user/:id (student) -> denied', async () => {
      const res = await http().get(`${API}/user/${users.admin.id}`).set('Authorization', `Bearer ${users.student.token}`);
      expect(DENIED).toContain(res.status);
    });
    it('DELETE /user/:id (student) -> denied', async () => {
      const res = await http().delete(`${API}/user/999999`).set('Authorization', `Bearer ${users.student.token}`);
      expect(DENIED).toContain(res.status);
    });
    it('DELETE /user/:id (admin, unknown) -> 404', () =>
      http().delete(`${API}/user/999999`).set('Authorization', `Bearer ${users.admin.token}`).expect(404));
  });

  // ---------------- DELETE own recitation ----------------
  describe('DELETE /recitations/:id', () => {
    it('owner deletes own recitation -> 200', () =>
      http().delete(`${API}/recitations/${recitationId}`).set('Authorization', `Bearer ${users.student.token}`).expect(200));
  });
});
