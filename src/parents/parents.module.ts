import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentsService } from './parents.service';
import { ParentsController } from './parents.controller';
import { ParentEntity } from './infrastructure/persistence/relational/entities/parent.entity';
import { ParentStudentEntity } from './infrastructure/persistence/relational/entities/parent-student.entity';
import { ParentsRelationalRepository } from './infrastructure/persistence/relational/repositories/parent.repository';
import { ParentStudentRepository } from './infrastructure/persistence/relational/repositories/parent-student.repository';
import { ParentMapper } from './infrastructure/persistence/relational/mappers/parent.mapper';
import { ParentStudentMapper } from './infrastructure/persistence/relational/mappers/parent-student.mapper';
import { ParentRepository } from './infrastructure/persistence/parent.repository';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { MailModule } from '../mail/mail.module';

const infrastructure = [
  {
    provide: ParentRepository,
    useClass: ParentsRelationalRepository,
  },
  ParentMapper,
  ParentStudentRepository,
  ParentStudentMapper,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([ParentEntity, ParentStudentEntity]),
    UsersModule,
    MailModule,
    forwardRef(() => StudentsModule),
  ],
  providers: [ParentsService, ...infrastructure],
  controllers: [ParentsController],
  exports: [ParentsService, ...infrastructure],
})
export class ParentsModule {}
