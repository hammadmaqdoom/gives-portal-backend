import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { StudentsModule } from './students/students.module';
import { ParentsModule } from './parents/parents.module';
import { TeachersModule } from './teachers/teachers.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { BatchTermsModule } from './batch-terms/batch-terms.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { PerformanceModule } from './performance/performance.module';
import { FeesModule } from './fees/fees.module';
import { InvoicesModule } from './invoices/invoices.module';
import { SessionModule } from './session/session.module';
import { CacheModule } from './cache/cache.module';
import { LoggingModule } from './logging/logging.module';
import { MailModule } from './mail/mail.module';
import { MailerModule } from './mailer/mailer.module';
import { HomeModule } from './home/home.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LearningModulesModule } from './learning-modules/learning-modules.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { SettingsModule } from './settings/settings.module';
import { ZoomModule } from './zoom/zoom.module';
import { PaymentsModule } from './payments/payments.module';
import { AnnotationsModule } from './annotations/annotations.module';
import { SmsModule } from './sms/sms.module';
import { FeeReminderModule } from './fee-reminders/fee-reminder.module';
import { InvoiceGenerationModule } from './invoice-generation/invoice-generation.module';
import { SentryModule } from './sentry/sentry.module';
import { CurrencyModule } from './currency/currency.module';
import { PublicModule } from './public/public.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { AccessControlModule } from './access-control/access-control.module';
import { AppDataSource } from './database/data-source';
import authConfig from './auth/config/auth.config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmConfigService } from './database/typeorm-config.service';
import databaseConfig from './database/config/database.config';
import appConfig from './config/app.config';
import mailConfig from './mail/config/mail.config';
import fileConfig from './files/config/file.config';
import sentryConfig from './config/sentry.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        appConfig,
        mailConfig,
        fileConfig,
        sentryConfig,
      ],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
    ScheduleModule.forRoot(),
    SentryModule,
    AuthModule,
    UsersModule,
    FilesModule,
    StudentsModule,
    ParentsModule,
    TeachersModule,
    ClassesModule,
    SubjectsModule,
    BatchTermsModule,
    AttendanceModule,
    AssignmentsModule,
    PerformanceModule,
    FeesModule,
    InvoicesModule,
    SessionModule,
    CacheModule,
    LoggingModule,
    MailModule,
    MailerModule,
    HomeModule,
    DashboardModule,
    LearningModulesModule,
    AnnouncementsModule,
    SettingsModule,
    ZoomModule,
    PaymentsModule,
    AnnotationsModule,
    SmsModule,
    FeeReminderModule,
    InvoiceGenerationModule,
    CurrencyModule,
    PublicModule,
    CartModule,
    CheckoutModule,
    AccessControlModule,
  ],
})
export class AppModule {}
