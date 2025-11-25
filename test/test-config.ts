import { ConfigModule } from '@nestjs/config';

export const TestConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
  load: [
    () => ({
      // Override database config for testing
      database: {
        type: 'sqlite',
        database: ':memory:',
        synchronize: true,
        logging: false,
      },
      // Override Redis config for testing
      redis: {
        host: 'localhost',
        port: 6379,
        password: '',
        db: 0,
        ttl: 3600,
      },
      // Override mail config for testing
      mail: {
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
        secure: false,
        requireTLS: false,
        defaultEmail: 'test@example.com',
        defaultName: 'Test',
        clientPort: 1080,
      },
      // Override app config for testing
      app: {
        port: 3001,
        name: 'Test API',
        apiPrefix: 'api',
        fallbackLanguage: 'en',
        headerLanguage: 'x-custom-lang',
        frontendDomain: 'http://localhost:3001',
        backendDomain: 'http://localhost:3001',
      },
    }),
  ],
});
