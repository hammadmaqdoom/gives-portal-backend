import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { testApp } from './setup';

describe('Simple E2E Test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await testApp.createApp();
  });

  afterAll(async () => {
    await testApp.closeApp();
  });

  it('should start the application successfully', () => {
    expect(app).toBeDefined();
    expect(app.getHttpServer()).toBeDefined();
  });

  it('should respond to health check', () => {
    return request(app.getHttpServer()).get('/api/v1').expect(200);
  });
});
