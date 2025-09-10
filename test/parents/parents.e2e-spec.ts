import { APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/constants';
import request from 'supertest';
import { CreateParentDto } from '../../src/parents/dto/create-parent.dto';
import { UpdateParentDto } from '../../src/parents/dto/update-parent.dto';

describe('Parents Module E2E Tests', () => {
  const app = APP_URL;
  let apiToken: string;
  let createdParentId: number;

  beforeAll(async () => {
    // Login as admin
    await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .then(({ body }) => {
        apiToken = body.token;
      });
  });

  describe('POST /api/v1/parents', () => {
    it('should create a new parent successfully', () => {
      const parentData: CreateParentDto = {
        name: 'Jane Doe',
        email: `parent.${Date.now()}@example.com`,
        phone: '+1234567890',
        passcode: '123456',
      };

      return request(app)
        .post('/api/v1/parents')
        .auth(apiToken, { type: 'bearer' })
        .send(parentData)
        .expect(201)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.name).toBe(parentData.name);
          expect(body.email).toBe(parentData.email);
          expect(body.phone).toBe(parentData.phone);
          expect(body.passcode).toBeDefined(); // Should be hashed
          expect(body.createdAt).toBeDefined();
          expect(body.updatedAt).toBeDefined();
          createdParentId = body.id;
        });
    });

    it('should fail to create parent with invalid data', () => {
      const invalidData = {
        name: '', // Empty name
        email: 'invalid-email',
        phone: '+1234567890',
        passcode: '123456',
      };

      return request(app)
        .post('/api/v1/parents')
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });

    it('should fail to create parent with duplicate email', () => {
      const parentData = {
        name: 'Duplicate Parent',
        email: `parent.${Date.now()}@example.com`,
        phone: '+1234567890',
        passcode: '123456',
      };

      // Create first parent
      return request(app)
        .post('/api/v1/parents')
        .auth(apiToken, { type: 'bearer' })
        .send(parentData)
        .then(() => {
          // Try to create second parent with same email
          return request(app)
            .post('/api/v1/parents')
            .auth(apiToken, { type: 'bearer' })
            .send(parentData)
            .expect(422);
        });
    });

    it('should fail to create parent without authentication', () => {
      const parentData = {
        name: 'Unauthorized Parent',
        email: `unauthorized.${Date.now()}@example.com`,
        phone: '+1234567890',
        passcode: '123456',
      };

      return request(app).post('/api/v1/parents').send(parentData).expect(401);
    });
  });

  describe('GET /api/v1/parents', () => {
    it('should list parents with pagination', () => {
      return request(app)
        .get('/api/v1/parents')
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

    it('should list parents with filtering', () => {
      return request(app)
        .get('/api/v1/parents?filters={"name":"Jane"}')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should list parents with email filtering', () => {
      return request(app)
        .get('/api/v1/parents?filters={"email":"parent"}')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should list parents with sorting', () => {
      return request(app)
        .get('/api/v1/parents?sort=[{"orderBy":"name","order":"ASC"}]')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should handle pagination parameters correctly', () => {
      return request(app)
        .get('/api/v1/parents?page=1&limit=5')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.meta.page).toBe(1);
          expect(body.meta.limit).toBe(5);
        });
    });
  });

  describe('GET /api/v1/parents/:id', () => {
    it('should get parent by ID successfully', () => {
      return request(app)
        .get(`/api/v1/parents/${createdParentId}`)
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdParentId);
          expect(body.name).toBeDefined();
          expect(body.email).toBeDefined();
          expect(body.phone).toBeDefined();
        });
    });

    it('should return 404 for non-existent parent', () => {
      return request(app)
        .get('/api/v1/parents/99999')
        .auth(apiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail to get parent without authentication', () => {
      return request(app).get(`/api/v1/parents/${createdParentId}`).expect(401);
    });
  });

  describe('PATCH /api/v1/parents/:id', () => {
    it('should update parent successfully', () => {
      const updateData: UpdateParentDto = {
        name: 'Jane Updated Doe',
        email: `updated.${Date.now()}@example.com`,
        phone: '+0987654321',
      };

      return request(app)
        .patch(`/api/v1/parents/${createdParentId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdParentId);
          expect(body.name).toBe(updateData.name);
          expect(body.email).toBe(updateData.email);
          expect(body.phone).toBe(updateData.phone);
          expect(body.updatedAt).toBeDefined();
        });
    });

    it('should fail to update parent with invalid data', () => {
      const invalidData = {
        name: '', // Empty name
        email: 'invalid-email-format',
      };

      return request(app)
        .patch(`/api/v1/parents/${createdParentId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });

    it('should return 404 for updating non-existent parent', () => {
      const updateData = {
        name: 'Non-existent Parent',
      };

      return request(app)
        .patch('/api/v1/parents/99999')
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(404);
    });

    it('should update parent passcode successfully', () => {
      const updateData = {
        passcode: 'newpasscode123',
      };

      return request(app)
        .patch(`/api/v1/parents/${createdParentId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdParentId);
          expect(body.passcode).toBeDefined();
          expect(body.passcode).not.toBe(updateData.passcode); // Should be hashed
        });
    });
  });

  describe('DELETE /api/v1/parents/:id', () => {
    it('should delete parent successfully', () => {
      return request(app)
        .delete(`/api/v1/parents/${createdParentId}`)
        .auth(apiToken, { type: 'bearer' })
        .expect(204);
    });

    it('should return 404 for deleting non-existent parent', () => {
      return request(app)
        .delete('/api/v1/parents/99999')
        .auth(apiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail to delete parent without authentication', () => {
      return request(app)
        .delete(`/api/v1/parents/${createdParentId}`)
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', () => {
      return request(app)
        .post('/api/v1/parents')
        .auth(apiToken, { type: 'bearer' })
        .set('Content-Type', 'application/json')
        .send('{"name": "John", "email":}')
        .expect(400);
    });

    it('should handle invalid pagination parameters', () => {
      return request(app)
        .get('/api/v1/parents?page=-1&limit=0')
        .auth(apiToken, { type: 'bearer' })
        .expect(422);
    });

    it('should handle invalid filter parameters', () => {
      return request(app)
        .get('/api/v1/parents?filters=invalid-json')
        .auth(apiToken, { type: 'bearer' })
        .expect(422);
    });
  });
});
