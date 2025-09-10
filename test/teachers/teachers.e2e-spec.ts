import { APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/constants';
import request from 'supertest';
import { CreateTeacherDto } from '../../src/teachers/dto/create-teacher.dto';
import { UpdateTeacherDto } from '../../src/teachers/dto/update-teacher.dto';

describe('Teachers Module E2E Tests', () => {
  const app = APP_URL;
  let apiToken: string;
  let createdTeacherId: number;

  beforeAll(async () => {
    // Login as admin
    await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .then(({ body }) => {
        apiToken = body.token;
      });
  });

  describe('POST /api/v1/teachers', () => {
    it('should create a new teacher successfully', () => {
      const teacherData: CreateTeacherDto = {
        name: 'Dr. Smith',
        email: `teacher.${Date.now()}@example.com`,
        phone: '+1234567890',
        commissionPercentage: 15.5,
        subjectsAllowed: ['Mathematics', 'Physics'],
      };

      return request(app)
        .post('/api/v1/teachers')
        .auth(apiToken, { type: 'bearer' })
        .send(teacherData)
        .expect(201)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.name).toBe(teacherData.name);
          expect(body.email).toBe(teacherData.email);
          expect(body.phone).toBe(teacherData.phone);
          expect(body.commissionPercentage).toBe(
            teacherData.commissionPercentage,
          );
          expect(body.subjectsAllowed).toEqual(teacherData.subjectsAllowed);
          expect(body.createdAt).toBeDefined();
          expect(body.updatedAt).toBeDefined();
          createdTeacherId = body.id;
        });
    });

    it('should fail to create teacher with invalid data', () => {
      const invalidData = {
        name: '', // Empty name
        email: 'invalid-email',
        phone: '+1234567890',
        commissionPercentage: 150, // Invalid percentage > 100
        subjectsAllowed: ['Mathematics'],
      };

      return request(app)
        .post('/api/v1/teachers')
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });

    it('should fail to create teacher without authentication', () => {
      const teacherData = {
        name: 'Unauthorized Teacher',
        email: `unauthorized.${Date.now()}@example.com`,
        phone: '+1234567890',
        commissionPercentage: 10.0,
        subjectsAllowed: ['Mathematics'],
      };

      return request(app)
        .post('/api/v1/teachers')
        .send(teacherData)
        .expect(401);
    });

    it('should create teacher without optional fields', () => {
      const teacherData = {
        name: 'Simple Teacher',
        commissionPercentage: 12.0,
        subjectsAllowed: ['Physics'],
      };

      return request(app)
        .post('/api/v1/teachers')
        .auth(apiToken, { type: 'bearer' })
        .send(teacherData)
        .expect(201)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.name).toBe(teacherData.name);
          expect(body.email).toBeNull();
          expect(body.phone).toBeNull();
          expect(body.commissionPercentage).toBe(
            teacherData.commissionPercentage,
          );
          expect(body.subjectsAllowed).toEqual(teacherData.subjectsAllowed);
        });
    });
  });

  describe('GET /api/v1/teachers', () => {
    it('should list teachers with pagination', () => {
      return request(app)
        .get('/api/v1/teachers')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
          expect(body.meta).toBeDefined();
          expect(body.meta.page).toBeDefined();
          expect(body.meta.limit).toBeDefined();
          expect(body.meta.total).toBeDefined();
        });
    });

    it('should list teachers with filtering', () => {
      return request(app)
        .get('/api/v1/teachers?filters={"name":"Dr. Smith"}')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should list teachers with email filtering', () => {
      return request(app)
        .get('/api/v1/teachers?filters={"email":"teacher"}')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should list teachers with sorting', () => {
      return request(app)
        .get('/api/v1/teachers?sort=[{"orderBy":"name","order":"ASC"}]')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should handle pagination parameters correctly', () => {
      return request(app)
        .get('/api/v1/teachers?page=1&limit=5')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.meta.page).toBe(1);
          expect(body.meta.limit).toBe(5);
        });
    });
  });

  describe('GET /api/v1/teachers/:id', () => {
    it('should get teacher by ID successfully', () => {
      return request(app)
        .get(`/api/v1/teachers/${createdTeacherId}`)
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdTeacherId);
          expect(body.name).toBeDefined();
          expect(body.email).toBeDefined();
          expect(body.phone).toBeDefined();
          expect(body.commissionPercentage).toBeDefined();
          expect(body.subjectsAllowed).toBeDefined();
        });
    });

    it('should return 404 for non-existent teacher', () => {
      return request(app)
        .get('/api/v1/teachers/99999')
        .auth(apiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail to get teacher without authentication', () => {
      return request(app)
        .get(`/api/v1/teachers/${createdTeacherId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/teachers/:id', () => {
    it('should update teacher successfully', () => {
      const updateData: UpdateTeacherDto = {
        name: 'Dr. Smith Updated',
        email: `updated.${Date.now()}@example.com`,
        phone: '+0987654321',
        commissionPercentage: 18.5,
        subjectsAllowed: ['Mathematics', 'Physics', 'Chemistry'],
      };

      return request(app)
        .patch(`/api/v1/teachers/${createdTeacherId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdTeacherId);
          expect(body.name).toBe(updateData.name);
          expect(body.email).toBe(updateData.email);
          expect(body.phone).toBe(updateData.phone);
          expect(body.commissionPercentage).toBe(
            updateData.commissionPercentage,
          );
          expect(body.subjectsAllowed).toEqual(updateData.subjectsAllowed);
          expect(body.updatedAt).toBeDefined();
        });
    });

    it('should fail to update teacher with invalid data', () => {
      const invalidData = {
        name: '', // Empty name
        commissionPercentage: 150, // Invalid percentage > 100
      };

      return request(app)
        .patch(`/api/v1/teachers/${createdTeacherId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });

    it('should return 404 for updating non-existent teacher', () => {
      const updateData = {
        name: 'Non-existent Teacher',
      };

      return request(app)
        .patch('/api/v1/teachers/99999')
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(404);
    });

    it('should update only specific fields', () => {
      const updateData = {
        commissionPercentage: 20.0,
      };

      return request(app)
        .patch(`/api/v1/teachers/${createdTeacherId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdTeacherId);
          expect(body.commissionPercentage).toBe(
            updateData.commissionPercentage,
          );
          // Other fields should remain unchanged
          expect(body.name).toBeDefined();
          expect(body.email).toBeDefined();
          expect(body.phone).toBeDefined();
          expect(body.subjectsAllowed).toBeDefined();
        });
    });
  });

  describe('DELETE /api/v1/teachers/:id', () => {
    it('should delete teacher successfully', () => {
      return request(app)
        .delete(`/api/v1/teachers/${createdTeacherId}`)
        .auth(apiToken, { type: 'bearer' })
        .expect(204);
    });

    it('should return 404 for deleting non-existent teacher', () => {
      return request(app)
        .delete('/api/v1/teachers/99999')
        .auth(apiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail to delete teacher without authentication', () => {
      return request(app)
        .delete(`/api/v1/teachers/${createdTeacherId}`)
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', () => {
      return request(app)
        .post('/api/v1/teachers')
        .auth(apiToken, { type: 'bearer' })
        .set('Content-Type', 'application/json')
        .send('{"name": "Teacher", "commissionPercentage":}')
        .expect(400);
    });

    it('should handle invalid pagination parameters', () => {
      return request(app)
        .get('/api/v1/teachers?page=-1&limit=0')
        .auth(apiToken, { type: 'bearer' })
        .expect(422);
    });

    it('should handle invalid subjectsAllowed array', () => {
      const invalidData = {
        name: 'Invalid Teacher',
        commissionPercentage: 15.0,
        subjectsAllowed: 'not-an-array',
      };

      return request(app)
        .post('/api/v1/teachers')
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });

    it('should handle invalid commission percentage type', () => {
      const invalidData = {
        name: 'Invalid Teacher',
        commissionPercentage: 'not-a-number',
      };

      return request(app)
        .post('/api/v1/teachers')
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });
  });
});
