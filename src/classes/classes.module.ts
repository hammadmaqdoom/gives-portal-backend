import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { RelationalClassPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { StudentsModule } from '../students/students.module';

const infrastructurePersistenceModule = RelationalClassPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, forwardRef(() => StudentsModule)],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService, infrastructurePersistenceModule],
})
export class ClassesModule {}
