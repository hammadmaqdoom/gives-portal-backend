// Load polyfills first to fix Node.js v25 compatibility issues
import './polyfills';
import 'dotenv/config';
import * as Sentry from '@sentry/node';
import type { Integration } from '@sentry/types';
import {
  ClassSerializerInterceptor,
  Logger,
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
  // Initialize Sentry before creating the app
  const sentryDsn = process.env.SENTRY_DSN;
  const sentryEnabled = process.env.SENTRY_ENABLED === 'true' || !!sentryDsn;

  if (sentryEnabled && sentryDsn) {
    // Profiling relies on a native prebuilt binary that may not exist for
    // the current Node ABI (e.g. Node 25). Load it defensively so a missing
    // binary disables profiling instead of crashing the process on boot.
    const integrations: Integration[] = [];
    let profilingLoaded = false;
    try {
      const { nodeProfilingIntegration } = require('@sentry/profiling-node');
      integrations.push(nodeProfilingIntegration());
      profilingLoaded = true;
    } catch (err) {
      console.warn(
        `[sentry] profiling-node unavailable, continuing without profiling: ${(err as Error).message}`,
      );
    }

    Sentry.init({
      dsn: sentryDsn,
      environment:
        process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      integrations,
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
        ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE)
        : 0.1,
      profilesSampleRate: profilingLoaded
        ? process.env.SENTRY_PROFILES_SAMPLE_RATE
          ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE)
          : 0.1
        : 0,
    });
  }

  // Crash-safety: make sure we always flush to Sentry before the process
  // dies on an unhandled rejection / uncaught exception. Without this, OOMs
  // and async bugs leave no trace beyond the container logs.
  const processLogger = new Logger('Process');

  const flushAndExit = async (code: number) => {
    try {
      if (sentryEnabled && sentryDsn) {
        await Sentry.close(2000);
      }
    } catch {
      // best-effort — never block shutdown on Sentry
    } finally {
      process.exit(code);
    }
  };

  process.on('unhandledRejection', (reason: unknown) => {
    processLogger.error(
      `Unhandled promise rejection: ${
        reason instanceof Error ? reason.stack : String(reason)
      }`,
    );
    if (sentryEnabled && sentryDsn) {
      Sentry.captureException(reason);
    }
    // Do not exit here — let the request finish. If the process is truly
    // wedged, the container healthcheck / orchestrator will restart it.
  });

  process.on('uncaughtException', (err: Error) => {
    processLogger.error(`Uncaught exception: ${err.stack ?? err.message}`);
    if (sentryEnabled && sentryDsn) {
      Sentry.captureException(err);
    }
    // Uncaught exceptions leave the process in an undefined state per
    // Node docs — flush Sentry then exit so the orchestrator restarts us.
    void flushAndExit(1);
  });

  const app = await NestFactory.create(AppModule);

  // Enable CORS with proper configuration
  // Note: When credentials: true, origin cannot be '*', must be specific or function
  app.enableCors({
    origin: (origin, callback) => {
      // Allow all origins (for development)
      // In production, replace with specific allowed origins
      callback(null, true);
    },
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-cart-session-id',
      'x-custom-lang',
      'Accept',
    ],
    exposedHeaders: ['Content-Type', 'Authorization'],
  });
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

    const document = SwaggerModule.createDocument(app, options, {
      deepScanRoutes: true,
    });
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
