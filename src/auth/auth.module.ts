import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { RegistrationController } from './registration.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AnonymousStrategy } from './strategies/anonymous.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notifications/notification.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { ParentsModule } from '../parents/parents.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { ClassesModule } from '../classes/classes.module';

@Module({
  imports: [
    UsersModule,
    SessionModule,
    PassportModule,
    MailModule,
    NotificationModule,
    JwtModule.register({}),
    StudentsModule,
    ParentsModule,
    InvoicesModule,
    ClassesModule,
  ],
  controllers: [AuthController, RegistrationController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, AnonymousStrategy],
  exports: [AuthService],
})
export class AuthModule {}
