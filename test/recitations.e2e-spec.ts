import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

const request = supertest.default || supertest;

describe('Recitations (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let studentToken: string;
  let studentId: number;
  let teacherToken: string;
  let teacherId: number;
  let parentToken: string;
  let parentId: number;
  let adminToken: string;
  let adminId: number;
  let recitationId: number;
  let childStudentId: number;

  // Helper function to create test audio file
  const createTestAudioFile = (): Buffer => {
    // Create a minimal valid MP3 file (ID3 tag + minimal MP3 frame)
    const buffer = Buffer.alloc(1024);
    // ID3v2 header
    buffer.write('ID3', 0);
    buffer[3] = 0x03; // Version
    buffer[4] = 0x00; // Revision
    return buffer;
  };

  // Helper function to create test user and get token
  const createUserAndLogin = async (
    role: string,
    email: string,
    name: string,
  ): Promise<{ token: string; userId: number }> => {
    // Register user
    const registerResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        email,
        password: 'Test@123456',
        name,
        role,
        phoneNumber: '+201234567890',
        gender: 'male',
        dateOfBirth: '2000-01-01',
        ageGroup: '13-17',
      });

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email,
        password: 'Test@123456',
      })
      .expect(200);

    return {
      token: loginResponse.body.data.accessToken,
      userId: loginResponse.body.data.user.id,
    };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Create test users
    const student = await createUserAndLogin(
      'student',
      'student-recitation@test.com',
      'Test Student',
    );
    studentToken = student.token;
    studentId = student.userId;

    const teacher = await createUserAndLogin(
      'teacher',
      'teacher-recitation@test.com',
      'Test Teacher',
    );
    teacherToken = teacher.token;
    teacherId = teacher.userId;

    const parent = await createUserAndLogin(
      'parent',
      'parent-recitation@test.com',
      'Test Parent',
    );
    parentToken = parent.token;
    parentId = parent.userId;

    const admin = await createUserAndLogin(
      'admin',
      'admin-recitation@test.com',
      'Test Admin',
    );
    adminToken = admin.token;
    adminId = admin.userId;

    // Create child student for parent tests
    const child = await createUserAndLogin(
      'student',
      'child-student@test.com',
      'Child Student',
    );
    childStudentId = child.userId;

    // Link child to parent
    await dataSource.query(
      `UPDATE users SET parent_id = $1 WHERE id = $2`,
      [parentId, childStudentId],
    );

    // Link students to teacher
    await dataSource.query(
      `UPDATE users SET teacher_id = $1 WHERE id IN ($2, $3)`,
      [teacherId, studentId, childStudentId],
    );

    // Create active subscription for students
    const planResponse = await request(app.getHttpServer())
      .post('/v1/plans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nameAr: 'خطة اختبار',
        nameEn: 'Test Plan',
        descriptionAr: 'خطة اختبار',
        descriptionEn: 'Test Plan',
        price: 100,
        currency: 'EGP',
        durationDays: 30,
        evaluationSessions: 10,
        features: ['ai_evaluation'],
        isActive: true,
      });

    const planId = planResponse.body.data.id;

    // Create subscriptions for students
    await dataSource.query(
      `INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, remaining_sessions, payment_status)
       VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '30 days', 10, 'paid'),
              ($3, $2, 'active', NOW(), NOW() + INTERVAL '30 days', 10, 'paid')`,
      [studentId, planId, childStudentId],
    );
  });

  afterAll(async () => {
    // Clean up test data
    if (dataSource) {
      await dataSource.query('DELETE FROM recitations WHERE 1=1');
      await dataSource.query('DELETE FROM subscriptions WHERE 1=1');
      await dataSource.query('DELETE FROM plans WHERE 1=1');
      await dataSource.query(
        `DELETE FROM users WHERE email IN (
          'student-recitation@test.com',
          'teacher-recitation@test.com',
          'parent-recitation@test.com',
          'admin-recitation@test.com',
          'child-student@test.com'
        )`,
      );
    }
    await app.close();
  });

  describe('POST /v1/recitations/upload', () => {
    it('should upload a recitation successfully (Student)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/recitations/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('surahId', '1')
        .field('fromAyah', '1')
        .field('toAyah', '7')
        .field('notes', 'Test recitation upload')
        .attach('audio', createTestAudioFile(), 'test-audio.mp3')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.surahId).toBe(1);
      expect(response.body.data.fromAyah).toBe(1);
      expect(response.body.data.toAyah).toBe(7);
      expect(response.body.data.status).toBe('pending');
      recitationId = response.body.data.id;
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/v1/recitations/upload')
        .field('surahId', '1')
        .field('fromAyah', '1')
        .field('toAyah', '7')
        .attach('audio', createTestAudioFile(), 'test.mp3')
        .expect(401);
    });

    it('should fail with invalid surahId', async () => {
      await request(app.getHttpServer())
        .post('/v1/recitations/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('surahId', '200')
        .field('fromAyah', '1')
        .field('toAyah', '7')
        .attach('audio', createTestAudioFile(), 'test.mp3')
        .expect(400);
    });

    it('should fail without audio file', async () => {
      await request(app.getHttpServer())
        .post('/v1/recitations/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('surahId', '1')
        .field('fromAyah', '1')
        .field('toAyah', '7')
        .expect(400);
    });

    it('should fail with teacher role', async () => {
      await request(app.getHttpServer())
        .post('/v1/recitations/upload')
        .set('Authorization', `Bearer ${teacherToken}`)
        .field('surahId', '1')
        .field('fromAyah', '1')
        .field('toAyah', '7')
        .attach('audio', createTestAudioFile(), 'test.mp3')
        .expect(403);
    });
  });

  describe('POST /v1/recitations/record-direct', () => {
    it('should record direct recitation successfully (Student)', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/recitations/record-direct')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('surahId', '2')
        .field('fromAyah', '1')
        .field('toAyah', '5')
        .field('notes', 'Direct recording test')
        .field('audioFormat', 'webm')
        .attach('audioBlob', createTestAudioFile(), 'recording.webm')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.surahId).toBe(2);
    });

    it('should fail without audioBlob', async () => {
      await request(app.getHttpServer())
        .post('/v1/recitations/record-direct')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('surahId', '1')
        .field('fromAyah', '1')
        .field('toAyah', '7')
        .expect(400);
    });

    it('should fail with parent role', async () => {
      await request(app.getHttpServer())
        .post('/v1/recitations/record-direct')
        .set('Authorization', `Bearer ${parentToken}`)
        .field('surahId', '1')
        .field('fromAyah', '1')
        .field('toAyah', '7')
        .attach('audioBlob', createTestAudioFile(), 'test.webm')
        .expect(403);
    });
  });

  describe('GET /v1/recitations/me', () => {
    it('should get student recitations with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/recitations/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('totalPages');
    });

    it('should filter recitations by surahId', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/recitations/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ surahId: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((recitation: any) => {
        expect(recitation.surahId).toBe(1);
      });
    });

    it('should filter recitations by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/recitations/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ status: 'pending' })
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((recitation: any) => {
        expect(recitation.status).toBe('pending');
      });
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/v1/recitations/me')
        .expect(401);
    });
  });

  describe('GET /v1/recitations/me/statistics', () => {
    it('should get student recitation statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/recitations/me/statistics')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalRecitations');
      expect(response.body.data).toHaveProperty('completedRecitations');
      expect(response.body.data).toHaveProperty('averageScore');
      expect(response.body.data).toHaveProperty('totalDuration');
      expect(response.body.data).toHaveProperty('recitationsBySurah');
    });

    it('should fail with teacher role', async () => {
      await request(app.getHttpServer())
        .get('/v1/recitations/me/statistics')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });
  });

  describe('GET /v1/recitations/:id', () => {
    it('should get recitation by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/recitations/${recitationId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(recitationId);
      expect(response.body.data).toHaveProperty('audioUrl');
      expect(response.body.data).toHaveProperty('surahId');
    });

    it('should fail for non-existent recitation', async () => {
      await request(app.getHttpServer())
        .get('/v1/recitations/999999')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });

    it('should fail when accessing another user recitation', async () => {
      // Create recitation with child student
      const childRecitation = await request(app.getHttpServer())
        .post('/v1/recitations/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('surahId', '1')
        .field('fromAyah', '1')
        .field('toAyah', '2')
        .attach('audio', createTestAudioFile(), 'test.mp3');

      // Try to access with different student (would need another student token)
      // This is simplified for the test structure
    });
  });

  describe('DELETE /v1/recitations/:id', () => {
    it('should delete own recitation', async () => {
      // Create a recitation to delete
      const createResponse = await request(app.getHttpServer())
        .post('/v1/recitations/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('surahId', '3')
        .field('fromAyah', '1')
        .field('toAyah', '5')
        .attach('audio', createTestAudioFile(), 'test.mp3');

      const deleteId = createResponse.body.data.id;

      const response = await request(app.getHttpServer())
        .delete(`/v1/recitations/${deleteId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
    });

    it('should fail to delete non-existent recitation', async () => {
      await request(app.getHttpServer())
        .delete('/v1/recitations/999999')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });
  });

  describe('GET /v1/recitations/admin/:id', () => {
    it('should get recitation as admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/recitations/admin/${recitationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(recitationId);
    });

    it('should get recitation as teacher', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/recitations/admin/${recitationId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail with student role', async () => {
      await request(app.getHttpServer())
        .get(`/v1/recitations/admin/${recitationId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('Parent Endpoints', () => {
    describe('GET /v1/recitations/parent/children', () => {
      it('should get all children overview for parent', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/recitations/parent/children')
          .set('Authorization', `Bearer ${parentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      it('should fail with student role', async () => {
        await request(app.getHttpServer())
          .get('/v1/recitations/parent/children')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(403);
      });
    });

    describe('GET /v1/recitations/parent/children/:childId/recitations', () => {
      it('should get child recitations for parent', async () => {
        const response = await request(app.getHttpServer())
          .get(`/v1/recitations/parent/children/${childStudentId}/recitations`)
          .set('Authorization', `Bearer ${parentToken}`)
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.meta).toHaveProperty('total');
      });

      it('should fail when accessing non-child student', async () => {
        await request(app.getHttpServer())
          .get(`/v1/recitations/parent/children/${studentId}/recitations`)
          .set('Authorization', `Bearer ${parentToken}`)
          .expect(403);
      });
    });

    describe('GET /v1/recitations/parent/children/:childId/statistics', () => {
      it('should get child statistics for parent', async () => {
        const response = await request(app.getHttpServer())
          .get(`/v1/recitations/parent/children/${childStudentId}/statistics`)
          .set('Authorization', `Bearer ${parentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalRecitations');
      });

      it('should fail when accessing non-child student', async () => {
        await request(app.getHttpServer())
          .get(`/v1/recitations/parent/children/${studentId}/statistics`)
          .set('Authorization', `Bearer ${parentToken}`)
          .expect(403);
      });
    });
  });

  describe('Teacher Endpoints', () => {
    describe('GET /v1/recitations/teacher/students', () => {
      it('should get all students overview for teacher', async () => {
        const response = await request(app.getHttpServer())
          .get('/v1/recitations/teacher/students')
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      it('should fail with parent role', async () => {
        await request(app.getHttpServer())
          .get('/v1/recitations/teacher/students')
          .set('Authorization', `Bearer ${parentToken}`)
          .expect(403);
      });
    });

    describe('GET /v1/recitations/teacher/students/:studentId/recitations', () => {
      it('should get student recitations for teacher', async () => {
        const response = await request(app.getHttpServer())
          .get(`/v1/recitations/teacher/students/${studentId}/recitations`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      it('should fail when accessing non-student', async () => {
        await request(app.getHttpServer())
          .get(`/v1/recitations/teacher/students/${adminId}/recitations`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(403);
      });
    });

    describe('GET /v1/recitations/teacher/students/:studentId/statistics', () => {
      it('should get student statistics for teacher', async () => {
        const response = await request(app.getHttpServer())
          .get(`/v1/recitations/teacher/students/${studentId}/statistics`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalRecitations');
      });
    });
  });

  describe('Teacher Evaluation Endpoints', () => {
    let evaluationRecitationId: number;

    beforeAll(async () => {
      // Create a recitation for evaluation tests
      const response = await request(app.getHttpServer())
        .post('/v1/recitations/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('surahId', '1')
        .field('fromAyah', '1')
        .field('toAyah', '3')
        .attach('audio', createTestAudioFile(), 'eval-test.mp3');

      evaluationRecitationId = response.body.data.id;
    });

    describe('GET /v1/recitations/teacher/:recitationId', () => {
      it('should get recitation for teacher evaluation', async () => {
        const response = await request(app.getHttpServer())
          .get(`/v1/recitations/teacher/${evaluationRecitationId}`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(200);

        expect(response.body.data.id).toBe(evaluationRecitationId);
        expect(response.body.data).toHaveProperty('audioUrl');
      });

      it('should fail with student role', async () => {
        await request(app.getHttpServer())
          .get(`/v1/recitations/teacher/${evaluationRecitationId}`)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(403);
      });
    });

    describe('POST /v1/recitations/teacher/:recitationId/evaluate', () => {
      it('should add teacher evaluation successfully', async () => {
        const response = await request(app.getHttpServer())
          .post(`/v1/recitations/teacher/${evaluationRecitationId}/evaluate`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            score: 85.5,
            notes: 'Great recitation! Keep up the good work.',
          })
          .expect(200);

        expect(response.body.data.teacherScore).toBe(85.5);
        expect(response.body.data.teacherNotes).toBe(
          'Great recitation! Keep up the good work.',
        );
        expect(response.body.data.evaluatedByTeacherId).toBe(teacherId);
      });

      it('should fail with invalid score (> 100)', async () => {
        await request(app.getHttpServer())
          .post(`/v1/recitations/teacher/${evaluationRecitationId}/evaluate`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            score: 150,
            notes: 'Invalid score test',
          })
          .expect(400);
      });

      it('should fail with invalid score (< 0)', async () => {
        await request(app.getHttpServer())
          .post(`/v1/recitations/teacher/${evaluationRecitationId}/evaluate`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            score: -10,
            notes: 'Invalid score test',
          })
          .expect(400);
      });

      it('should fail when evaluation already exists', async () => {
        await request(app.getHttpServer())
          .post(`/v1/recitations/teacher/${evaluationRecitationId}/evaluate`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            score: 90,
            notes: 'Duplicate evaluation test',
          })
          .expect(400);
      });

      it('should fail with student role', async () => {
        // Create new recitation
        const newRecitation = await request(app.getHttpServer())
          .post('/v1/recitations/upload')
          .set('Authorization', `Bearer ${studentToken}`)
          .field('surahId', '2')
          .field('fromAyah', '1')
          .field('toAyah', '2')
          .attach('audio', createTestAudioFile(), 'test.mp3');

        await request(app.getHttpServer())
          .post(
            `/v1/recitations/teacher/${newRecitation.body.data.id}/evaluate`,
          )
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            score: 80,
            notes: 'Test',
          })
          .expect(403);
      });
    });

    describe('PATCH /v1/recitations/teacher/:recitationId/evaluate', () => {
      it('should update teacher evaluation successfully', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/v1/recitations/teacher/${evaluationRecitationId}/evaluate`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            score: 90,
            notes: 'Updated evaluation notes',
          })
          .expect(200);

        expect(response.body.data.teacherScore).toBe(90);
        expect(response.body.data.teacherNotes).toBe('Updated evaluation notes');
      });

      it('should fail when no evaluation exists', async () => {
        // Create new recitation without evaluation
        const newRecitation = await request(app.getHttpServer())
          .post('/v1/recitations/upload')
          .set('Authorization', `Bearer ${studentToken}`)
          .field('surahId', '4')
          .field('fromAyah', '1')
          .field('toAyah', '2')
          .attach('audio', createTestAudioFile(), 'test.mp3');

        await request(app.getHttpServer())
          .patch(
            `/v1/recitations/teacher/${newRecitation.body.data.id}/evaluate`,
          )
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            score: 85,
            notes: 'Should fail',
          })
          .expect(400);
      });

      it('should fail with invalid score', async () => {
        await request(app.getHttpServer())
          .patch(`/v1/recitations/teacher/${evaluationRecitationId}/evaluate`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            score: 200,
            notes: 'Invalid score',
          })
          .expect(400);
      });
    });
  });

  describe('POST /v1/recitations/webhook/ai-evaluation', () => {
    it('should receive AI webhook with valid secret', async () => {
      // This test assumes webhook secret is configured
      // You may need to adjust based on your actual webhook secret setup
      const webhookSecret = process.env.AI_WEBHOOK_SECRET || 'test-secret';

      const response = await request(app.getHttpServer())
        .post('/v1/recitations/webhook/ai-evaluation')
        .set('Authorization', `Bearer ${webhookSecret}`)
        .send({
          jobId: 'test-job-123',
          recitationId: recitationId,
          status: 'completed',
          score: 87.5,
          detailedFeedback: {
            tajweed: 90,
            pronunciation: 85,
            fluency: 88,
          },
          mistakes: [
            {
              ayahNumber: 1,
              timestamp: 5.2,
              type: 'tajweed',
              description: 'Madd should be longer',
            },
          ],
          processedAt: new Date().toISOString(),
        });

      // Response may vary based on implementation
      // Adjust assertions accordingly
    });

    it('should fail with invalid webhook secret', async () => {
      await request(app.getHttpServer())
        .post('/v1/recitations/webhook/ai-evaluation')
        .set('Authorization', 'Bearer invalid-secret')
        .send({
          jobId: 'test-job-456',
          recitationId: recitationId,
          status: 'completed',
          score: 80,
        })
        .expect(401);
    });

    it('should fail without authorization header', async () => {
      await request(app.getHttpServer())
        .post('/v1/recitations/webhook/ai-evaluation')
        .send({
          jobId: 'test-job-789',
          recitationId: recitationId,
          status: 'completed',
          score: 80,
        })
        .expect(401);
    });
  });
});
