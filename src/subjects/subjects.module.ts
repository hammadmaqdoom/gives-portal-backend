import { Module } from '@nestjs/common';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { RelationalSubjectPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

const infrastructurePersistenceModule = RelationalSubjectPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService, infrastructurePersistenceModule],
})
export class SubjectsModule {}
