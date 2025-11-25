import { APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/constants';
import request from 'supertest';
import { CreateClassDto } from '../../src/classes/dto/create-class.dto';
import { UpdateClassDto } from '../../src/classes/dto/update-class.dto';

describe('Classes Module E2E Tests', () => {
  const app = APP_URL;
  let apiToken: string;
  let createdClassId: number;
  let createdSubjectId: number;
  let createdTeacherId: number;

  beforeAll(async () => {
    // Login as admin
    await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .then(({ body }) => {
        apiToken = body.token;
      });

    // Create test subject
    const subjectData = {
      name: 'Mathematics',
      description: 'Advanced mathematics course',
      defaultFee: 150.0,
    };

    await request(app)
      .post('/api/v1/subjects')
      .auth(apiToken, { type: 'bearer' })
      .send(subjectData)
      .then(({ body }) => {
        createdSubjectId = body.id;
      });

    // Create test teacher
    const teacherData = {
      name: 'Dr. Smith',
      email: `teacher.${Date.now()}@example.com`,
      phone: '+1234567890',
      commissionPercentage: 15.5,
      subjectsAllowed: ['Mathematics', 'Physics'],
    };

    await request(app)
      .post('/api/v1/teachers')
      .auth(apiToken, { type: 'bearer' })
      .send(teacherData)
      .then(({ body }) => {
        createdTeacherId = body.id;
      });
  });

  describe('POST /api/v1/classes', () => {
    it('should create a new class successfully', () => {
      const classData: CreateClassDto = {
        name: 'Mathematics 101',
        batchTerm: 'Aug 2025 – April 2026',
        weekdays: ['Tuesday', 'Thursday'],
        timing: '8:00PM–10:00PM',
        courseOutline:
          'Advanced mathematics course covering algebra and calculus',
        subject: { id: createdSubjectId },
        teacher: { id: createdTeacherId },
      };

      return request(app)
        .post('/api/v1/classes')
        .auth(apiToken, { type: 'bearer' })
        .send(classData)
        .expect(201)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.name).toBe(classData.name);
          expect(body.batchTerm).toBe(classData.batchTerm);
          expect(body.weekdays).toEqual(classData.weekdays);
          expect(body.timing).toBe(classData.timing);
          expect(body.courseOutline).toBe(classData.courseOutline);
          expect(body.subject.id).toBe(createdSubjectId);
          expect(body.teacher.id).toBe(createdTeacherId);
          expect(body.createdAt).toBeDefined();
          expect(body.updatedAt).toBeDefined();
          createdClassId = body.id;
        });
    });

    it('should fail to create class with invalid data', () => {
      const invalidData = {
        name: '', // Empty name
        batchTerm: 'Aug 2025 – April 2026',
        weekdays: ['Tuesday', 'Thursday'],
        timing: '8:00PM–10:00PM',
      };

      return request(app)
        .post('/api/v1/classes')
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });

    it('should fail to create class without authentication', () => {
      const classData = {
        name: 'Unauthorized Class',
        batchTerm: 'Aug 2025 – April 2026',
        weekdays: ['Tuesday', 'Thursday'],
        timing: '8:00PM–10:00PM',
      };

      return request(app).post('/api/v1/classes').send(classData).expect(401);
    });

    it('should create class without optional fields', () => {
      const classData = {
        name: 'Simple Class',
        batchTerm: 'Aug 2025 – April 2026',
        weekdays: ['Monday', 'Wednesday'],
        timing: '6:00PM–8:00PM',
      };

      return request(app)
        .post('/api/v1/classes')
        .auth(apiToken, { type: 'bearer' })
        .send(classData)
        .expect(201)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.name).toBe(classData.name);
          expect(body.courseOutline).toBeNull();
          expect(body.subject).toBeNull();
          expect(body.teacher).toBeNull();
        });
    });
  });

  describe('GET /api/v1/classes', () => {
    it('should list classes with pagination', () => {
      return request(app)
        .get('/api/v1/classes')
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

    it('should list classes with filtering', () => {
      return request(app)
        .get('/api/v1/classes?filters={"name":"Mathematics"}')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should list classes with batch term filtering', () => {
      return request(app)
        .get('/api/v1/classes?filters={"batchTerm":"Aug 2025"}')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should list classes with sorting', () => {
      return request(app)
        .get('/api/v1/classes?sort=[{"orderBy":"name","order":"ASC"}]')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should handle pagination parameters correctly', () => {
      return request(app)
        .get('/api/v1/classes?page=1&limit=5')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.meta.page).toBe(1);
          expect(body.meta.limit).toBe(5);
        });
    });
  });

  describe('GET /api/v1/classes/:id', () => {
    it('should get class by ID successfully', () => {
      return request(app)
        .get(`/api/v1/classes/${createdClassId}`)
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdClassId);
          expect(body.name).toBeDefined();
          expect(body.batchTerm).toBeDefined();
          expect(body.weekdays).toBeDefined();
          expect(body.timing).toBeDefined();
        });
    });

    it('should return 404 for non-existent class', () => {
      return request(app)
        .get('/api/v1/classes/99999')
        .auth(apiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail to get class without authentication', () => {
      return request(app).get(`/api/v1/classes/${createdClassId}`).expect(401);
    });
  });

  describe('PATCH /api/v1/classes/:id', () => {
    it('should update class successfully', () => {
      const updateData: UpdateClassDto = {
        name: 'Mathematics 101 Updated',
        batchTerm: 'Sep 2025 – May 2026',
        weekdays: ['Monday', 'Wednesday', 'Friday'],
        timing: '7:00PM–9:00PM',
        courseOutline: 'Updated course outline with advanced topics',
      };

      return request(app)
        .patch(`/api/v1/classes/${createdClassId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdClassId);
          expect(body.name).toBe(updateData.name);
          expect(body.batchTerm).toBe(updateData.batchTerm);
          expect(body.weekdays).toEqual(updateData.weekdays);
          expect(body.timing).toBe(updateData.timing);
          expect(body.courseOutline).toBe(updateData.courseOutline);
          expect(body.updatedAt).toBeDefined();
        });
    });

    it('should fail to update class with invalid data', () => {
      const invalidData = {
        name: '', // Empty name
        batchTerm: 'Invalid Term',
      };

      return request(app)
        .patch(`/api/v1/classes/${createdClassId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });

    it('should return 404 for updating non-existent class', () => {
      const updateData = {
        name: 'Non-existent Class',
      };

      return request(app)
        .patch('/api/v1/classes/99999')
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(404);
    });

    it('should update class with new subject and teacher', () => {
      const updateData = {
        subject: { id: createdSubjectId },
        teacher: { id: createdTeacherId },
      };

      return request(app)
        .patch(`/api/v1/classes/${createdClassId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdClassId);
          expect(body.subject.id).toBe(createdSubjectId);
          expect(body.teacher.id).toBe(createdTeacherId);
        });
    });
  });

  describe('DELETE /api/v1/classes/:id', () => {
    it('should delete class successfully', () => {
      return request(app)
        .delete(`/api/v1/classes/${createdClassId}`)
        .auth(apiToken, { type: 'bearer' })
        .expect(204);
    });

    it('should return 404 for deleting non-existent class', () => {
      return request(app)
        .delete('/api/v1/classes/99999')
        .auth(apiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail to delete class without authentication', () => {
      return request(app)
        .delete(`/api/v1/classes/${createdClassId}`)
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', () => {
      return request(app)
        .post('/api/v1/classes')
        .auth(apiToken, { type: 'bearer' })
        .set('Content-Type', 'application/json')
        .send('{"name": "Class", "batchTerm":}')
        .expect(400);
    });

    it('should handle invalid pagination parameters', () => {
      return request(app)
        .get('/api/v1/classes?page=-1&limit=0')
        .auth(apiToken, { type: 'bearer' })
        .expect(422);
    });

    it('should handle invalid weekdays array', () => {
      const invalidData = {
        name: 'Invalid Class',
        batchTerm: 'Aug 2025 – April 2026',
        weekdays: 'not-an-array',
        timing: '8:00PM–10:00PM',
      };

      return request(app)
        .post('/api/v1/classes')
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });
  });
});
