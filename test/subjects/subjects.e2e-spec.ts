import { APP_URL, ADMIN_EMAIL, ADMIN_PASSWORD } from '../utils/constants';
import request from 'supertest';
import { CreateSubjectDto } from '../../src/subjects/dto/create-subject.dto';
import { UpdateSubjectDto } from '../../src/subjects/dto/update-subject.dto';

describe('Subjects Module E2E Tests', () => {
  const app = APP_URL;
  let apiToken: string;
  let createdSubjectId: number;

  beforeAll(async () => {
    // Login as admin
    await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .then(({ body }) => {
        apiToken = body.token;
      });
  });

  describe('POST /api/v1/subjects', () => {
    it('should create a new subject successfully', () => {
      const subjectData: CreateSubjectDto = {
        name: 'Mathematics',
        description:
          'Advanced mathematics course covering algebra and calculus',
        defaultFee: 150.0,
      };

      return request(app)
        .post('/api/v1/subjects')
        .auth(apiToken, { type: 'bearer' })
        .send(subjectData)
        .expect(201)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.name).toBe(subjectData.name);
          expect(body.description).toBe(subjectData.description);
          expect(body.defaultFee).toBe(subjectData.defaultFee);
          expect(body.createdAt).toBeDefined();
          expect(body.updatedAt).toBeDefined();
          createdSubjectId = body.id;
        });
    });

    it('should fail to create subject with invalid data', () => {
      const invalidData = {
        name: '', // Empty name
        description: 'Advanced mathematics course',
        defaultFee: -50, // Negative fee
      };

      return request(app)
        .post('/api/v1/subjects')
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });

    it('should fail to create subject without authentication', () => {
      const subjectData = {
        name: 'Unauthorized Subject',
        description: 'Unauthorized course',
        defaultFee: 100.0,
      };

      return request(app)
        .post('/api/v1/subjects')
        .send(subjectData)
        .expect(401);
    });

    it('should create subject without optional description', () => {
      const subjectData = {
        name: 'Physics',
        defaultFee: 200.0,
      };

      return request(app)
        .post('/api/v1/subjects')
        .auth(apiToken, { type: 'bearer' })
        .send(subjectData)
        .expect(201)
        .expect(({ body }) => {
          expect(body.id).toBeDefined();
          expect(body.name).toBe(subjectData.name);
          expect(body.description).toBeNull();
          expect(body.defaultFee).toBe(subjectData.defaultFee);
        });
    });
  });

  describe('GET /api/v1/subjects', () => {
    it('should list subjects with pagination', () => {
      return request(app)
        .get('/api/v1/subjects')
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

    it('should list subjects with filtering', () => {
      return request(app)
        .get('/api/v1/subjects?filters={"name":"Mathematics"}')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should list subjects with description filtering', () => {
      return request(app)
        .get('/api/v1/subjects?filters={"description":"mathematics"}')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should list subjects with sorting', () => {
      return request(app)
        .get('/api/v1/subjects?sort=[{"orderBy":"name","order":"ASC"}]')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.data).toBeDefined();
          expect(Array.isArray(body.data)).toBe(true);
        });
    });

    it('should handle pagination parameters correctly', () => {
      return request(app)
        .get('/api/v1/subjects?page=1&limit=5')
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.meta.page).toBe(1);
          expect(body.meta.limit).toBe(5);
        });
    });
  });

  describe('GET /api/v1/subjects/:id', () => {
    it('should get subject by ID successfully', () => {
      return request(app)
        .get(`/api/v1/subjects/${createdSubjectId}`)
        .auth(apiToken, { type: 'bearer' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdSubjectId);
          expect(body.name).toBeDefined();
          expect(body.description).toBeDefined();
          expect(body.defaultFee).toBeDefined();
        });
    });

    it('should return 404 for non-existent subject', () => {
      return request(app)
        .get('/api/v1/subjects/99999')
        .auth(apiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail to get subject without authentication', () => {
      return request(app)
        .get(`/api/v1/subjects/${createdSubjectId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/subjects/:id', () => {
    it('should update subject successfully', () => {
      const updateData: UpdateSubjectDto = {
        name: 'Mathematics Updated',
        description: 'Updated mathematics course with advanced topics',
        defaultFee: 200.0,
      };

      return request(app)
        .patch(`/api/v1/subjects/${createdSubjectId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdSubjectId);
          expect(body.name).toBe(updateData.name);
          expect(body.description).toBe(updateData.description);
          expect(body.defaultFee).toBe(updateData.defaultFee);
          expect(body.updatedAt).toBeDefined();
        });
    });

    it('should fail to update subject with invalid data', () => {
      const invalidData = {
        name: '', // Empty name
        defaultFee: -100, // Negative fee
      };

      return request(app)
        .patch(`/api/v1/subjects/${createdSubjectId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });

    it('should return 404 for updating non-existent subject', () => {
      const updateData = {
        name: 'Non-existent Subject',
      };

      return request(app)
        .patch('/api/v1/subjects/99999')
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(404);
    });

    it('should update only specific fields', () => {
      const updateData = {
        defaultFee: 250.0,
      };

      return request(app)
        .patch(`/api/v1/subjects/${createdSubjectId}`)
        .auth(apiToken, { type: 'bearer' })
        .send(updateData)
        .expect(200)
        .expect(({ body }) => {
          expect(body.id).toBe(createdSubjectId);
          expect(body.defaultFee).toBe(updateData.defaultFee);
          // Other fields should remain unchanged
          expect(body.name).toBeDefined();
          expect(body.description).toBeDefined();
        });
    });
  });

  describe('DELETE /api/v1/subjects/:id', () => {
    it('should delete subject successfully', () => {
      return request(app)
        .delete(`/api/v1/subjects/${createdSubjectId}`)
        .auth(apiToken, { type: 'bearer' })
        .expect(204);
    });

    it('should return 404 for deleting non-existent subject', () => {
      return request(app)
        .delete('/api/v1/subjects/99999')
        .auth(apiToken, { type: 'bearer' })
        .expect(404);
    });

    it('should fail to delete subject without authentication', () => {
      return request(app)
        .delete(`/api/v1/subjects/${createdSubjectId}`)
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in request body', () => {
      return request(app)
        .post('/api/v1/subjects')
        .auth(apiToken, { type: 'bearer' })
        .set('Content-Type', 'application/json')
        .send('{"name": "Subject", "defaultFee":}')
        .expect(400);
    });

    it('should handle invalid pagination parameters', () => {
      return request(app)
        .get('/api/v1/subjects?page=-1&limit=0')
        .auth(apiToken, { type: 'bearer' })
        .expect(422);
    });

    it('should handle invalid filter parameters', () => {
      return request(app)
        .get('/api/v1/subjects?filters=invalid-json')
        .auth(apiToken, { type: 'bearer' })
        .expect(422);
    });

    it('should handle invalid defaultFee type', () => {
      const invalidData = {
        name: 'Invalid Subject',
        defaultFee: 'not-a-number',
      };

      return request(app)
        .post('/api/v1/subjects')
        .auth(apiToken, { type: 'bearer' })
        .send(invalidData)
        .expect(422);
    });
  });
});
