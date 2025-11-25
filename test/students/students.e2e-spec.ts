import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateStudentDto } from '../../src/students/dto/create-student.dto';
import { UpdateStudentDto } from '../../src/students/dto/update-student.dto';
import { testApp } from '../setup';

describe('Students Module E2E Tests', () => {
  let app: INestApplication;
  let apiToken: string;
  let createdStudentId: number;
  let createdParentId: number;
  let createdClassId: number;

  beforeAll(async () => {
    app = await testApp.createApp();

    // Login as admin
    await request(app.getHttpServer())
      .post('/api/v1/auth/email/login')
      .send({ email: 'admin@example.com', password: 'secret' })
      .then(({ body }) => {
        apiToken = body.token;
      });

    // Create test parent
    const parentData = {
      name: 'Test Parent',
      email: `parent.${Date.now()}@example.com`,
      phone: '+1234567890',
      passcode: '123456',
    };

    await request(app.getHttpServer())
      .post('/api/v1/parents')
      .auth(apiToken, { type: 'bearer' })
      .send(parentData)
      .then(({ body }) => {
        createdParentId = body.id;
      });

    // Create test class
    const classData = {
      name: 'Test Class',
      batchTerm: 'Aug 2025 – April 2026',
      weekdays: ['Tuesday', 'Thursday'],
      timing: '8:00PM–10:00PM',
      courseOutline: 'Test course outline',
    };

    await request(app.getHttpServer())
      .post('/api/v1/classes')
      .auth(apiToken, { type: 'bearer' })
      .send(classData)
      .then(({ body }) => {
        createdClassId = body.id;
      });
  });

  afterAll(async () => {
    await testApp.closeApp();
  });

  describe('POST /api/v1/students', () => {
    it('should create a new student successfully', () => {
      const studentData: CreateStudentDto = {
        name: 'John Doe',
        address: '123 Main St, City',
        contact: '+1234567890',
        class: { id: createdClassId },
        parent: { id: createdParentId },
      };

      return request(app.getHttpServer())
        .post('/api/v1/students')
        .auth(apiToken, { type: 'bearer' })
        .send(studentData)
        .expect(201)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.studentId).toBeDefined();
          expect(body.name).toBe(studentData.name);
          expect(body.address).toBe(studentData.address);
          expect(body.contact).toBe(studentData.contact);
          expect(body.class.id).toBe(createdClassId);
          expect(body.parent.id).toBe(createdParentId);
          expect(body.createdAt).toBeDefined();
          expect(body.updatedAt).toBeDefined();
          createdStudentId = body.id;
        });
    });

    it('should fail to create student with invalid data', () => {
      const invalidData = {
        name: '', // Empty name
        address: '123 Main St, City',
        contact: '+1234567890',
      };

      return request(app.getHttpServer())
        .post('/api/v1/students')
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });

    it('should fail to create student without authentication', () => {
      const studentData = {
        name: 'John Doe',
        address: '123 Main St, City',
        contact: '+1234567890',
      };

      return request(app.getHttpServer())
        .post('/api/v1/students')
        .send(studentData)
        .expect(401);
    });
  });

  describe('GET /api/v1/students', () => {
    it('should list students with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body.data)).toBe(true);
          expect(body.meta).toBeDefined();
          expect(body.meta.page).toBe(1);
          expect(body.meta.limit).toBe(10);
        });
    });

    it('should list students with filtering', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students?search=John')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should list students with sorting', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students?orderBy=name&order=ASC')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should handle pagination parameters correctly', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students?page=2&limit=5')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.meta.page).toBe(2);
          expect(body.meta.limit).toBe(5);
        });
    });
  });

  describe('GET /api/v1/students/:id', () => {
    it('should get student by ID successfully', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/students/${createdStudentId}`)
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdStudentId);
          expect(body.name).toBe('John Doe');
        });
    });

    it('should return 404 for non-existent student', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students/99999')
        .auth(apiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail to get student without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/students/${createdStudentId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/students/:id', () => {
    it('should update student successfully', () => {
      const updateData: UpdateStudentDto = {
        name: 'John Updated',
        address: '456 New St, City',
      };

      return request(app.getHttpServer())
        .patch(`/api/v1/students/${createdStudentId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(200)
        .expect(({ body }) => {
          expect(body.name).toBe(updateData.name);
          expect(body.address).toBe(updateData.address);
        });
    });

    it('should fail to update student with invalid data', () => {
      const invalidData = {
        name: '', // Empty name
        address: '456 New St, City',
      };

      return request(app.getHttpServer())
        .patch(`/api/v1/students/${createdStudentId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });

    it('should return 404 for updating non-existent student', () => {
      const updateData = {
        name: 'John Updated',
        address: '456 New St, City',
      };

      return request(app.getHttpServer())
        .patch('/api/v1/students/99999')
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/v1/students/:id', () => {
    it('should delete student successfully', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/students/${createdStudentId}`)
        .auth(apiToken, { type: 'bearer' })
        .expect(204);
    });

    it('should return 404 for deleting non-existent student', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/students/99999')
        .auth(apiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail to delete student without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/students/${createdStudentId}`)
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', () => {
      return request(app.getHttpServer())
        .post('/api/v1/students')
        .auth(apiToken, { type: 'bearer' })
        .set('Content-Type', 'application/json')
        .send('{"name": "John", "invalid": json}')
        .expect(400);
    });

    it('should handle invalid pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students?page=invalid&limit=invalid')
        .auth(apiToken, { type: 'bearer' })
        .expect(400);
    });
  });
});
