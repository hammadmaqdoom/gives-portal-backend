import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { StudentRepository } from './infrastructure/persistence/student.repository';
import { StudentsRelationalRepository } from './infrastructure/persistence/relational/repositories/student.repository';
import { StudentClassEnrollmentRepository } from './infrastructure/persistence/relational/repositories/student-class-enrollment.repository';
import { StudentClassEnrollmentMapper } from './infrastructure/persistence/relational/mappers/student-class-enrollment.mapper';
import { StudentEntity } from './infrastructure/persistence/relational/entities/student.entity';
import { StudentClassEnrollmentEntity } from './infrastructure/persistence/relational/entities/student-class-enrollment.entity';
import { StudentMapper } from './infrastructure/persistence/relational/mappers/student.mapper';
import { FilesModule } from '../files/files.module';
import { UsersModule } from '../users/users.module';
import { ParentsModule } from '../parents/parents.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { ClassesModule } from '../classes/classes.module';
import { NotificationModule } from '../notifications/notification.module';
import { CurrencyModule } from '../currency/currency.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentEntity, StudentClassEnrollmentEntity]),
    forwardRef(() => FilesModule),
    UsersModule,
    NotificationModule,
    CurrencyModule,
    MailModule,
    forwardRef(() => ParentsModule),
    forwardRef(() => InvoicesModule),
    forwardRef(() => ClassesModule),
  ],
  controllers: [StudentsController],
  providers: [
    StudentsService,
    {
      provide: StudentRepository,
      useClass: StudentsRelationalRepository,
    },
    StudentClassEnrollmentRepository,
    StudentClassEnrollmentMapper,
    StudentMapper,
  ],
  exports: [
    StudentsService,
    StudentRepository,
    StudentClassEnrollmentRepository,
    StudentClassEnrollmentMapper,
  ],
})
export class StudentsModule {}
