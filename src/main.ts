import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  (global as any).nestjsApp = app;
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  // Debug the database configuration
  // console.log('Database Configuration Debug:');
  // console.log('DATABASE_HOST:', process.env.DATABASE_HOST);
  // console.log('DATABASE_PORT:', process.env.DATABASE_PORT);
  // console.log('DATABASE_USERNAME:', process.env.DATABASE_USERNAME);
  // console.log('DATABASE_NAME:', process.env.DATABASE_NAME);
  // console.log(
  //   'DATABASE_PASSWORD:',
  //   process.env.DATABASE_PASSWORD ? '***SET***' : '***NOT SET***',
  // );

  // Replace the debug section with this:
  // try {
  //   const dbHost = configService.get('database.host', { infer: true });
  //   const dbPort = configService.get('database.port', { infer: true });
  //   const dbName = configService.get('database.name', { infer: true });
  //   console.log('ConfigService database.host:', dbHost);
  //   console.log('ConfigService database.port:', dbPort);
  //   console.log('ConfigService database.name:', dbName);
  // } catch (error) {
  //   console.log('ConfigService error:', error.message);
  // }

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // Enable Swagger only when not in production
  if (configService.get('app.nodeEnv', { infer: true }) !== 'production') {
    const options = new DocumentBuilder()
      .setTitle('API')
      .setDescription('API docs')
      .setVersion('1.0')
      .addBearerAuth()
      .addGlobalParameters({
        in: 'header',
        required: false,
        name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
        schema: {
          example: 'en',
        },
      })
      .build();

    const document = SwaggerModule.createDocument(app, options, { deepScanRoutes: true });
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
