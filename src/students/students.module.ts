import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { FaceEmbeddingsService } from './face-embeddings.service';
import { FaceEmbeddingsController } from './face-embeddings.controller';
import { StudentRepository } from './infrastructure/persistence/student.repository';
import { StudentsRelationalRepository } from './infrastructure/persistence/relational/repositories/student.repository';
import { StudentClassEnrollmentRepository } from './infrastructure/persistence/relational/repositories/student-class-enrollment.repository';
import { StudentFaceEmbeddingRepository } from './infrastructure/persistence/relational/repositories/student-face-embedding.repository';
import { StudentClassEnrollmentMapper } from './infrastructure/persistence/relational/mappers/student-class-enrollment.mapper';
import { StudentFaceEmbeddingMapper } from './infrastructure/persistence/relational/mappers/student-face-embedding.mapper';
import { StudentEntity } from './infrastructure/persistence/relational/entities/student.entity';
import { StudentClassEnrollmentEntity } from './infrastructure/persistence/relational/entities/student-class-enrollment.entity';
import { StudentFaceEmbeddingEntity } from './infrastructure/persistence/relational/entities/student-face-embedding.entity';
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
    TypeOrmModule.forFeature([
      StudentEntity,
      StudentClassEnrollmentEntity,
      StudentFaceEmbeddingEntity,
    ]),
    forwardRef(() => FilesModule),
    forwardRef(() => UsersModule),
    forwardRef(() => NotificationModule),
    forwardRef(() => CurrencyModule),
    forwardRef(() => MailModule),
    forwardRef(() => ParentsModule),
    forwardRef(() => InvoicesModule),
    forwardRef(() => ClassesModule),
  ],
  controllers: [StudentsController, FaceEmbeddingsController],
  providers: [
    StudentsService,
    FaceEmbeddingsService,
    {
      provide: StudentRepository,
      useClass: StudentsRelationalRepository,
    },
    StudentClassEnrollmentRepository,
    StudentFaceEmbeddingRepository,
    StudentClassEnrollmentMapper,
    StudentFaceEmbeddingMapper,
    StudentMapper,
  ],
  exports: [
    StudentsService,
    FaceEmbeddingsService,
    StudentRepository,
    StudentClassEnrollmentRepository,
    StudentFaceEmbeddingRepository,
    StudentClassEnrollmentMapper,
  ],
})
export class StudentsModule {}
