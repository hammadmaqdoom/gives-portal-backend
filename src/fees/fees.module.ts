import { Module, forwardRef } from '@nestjs/common';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { RelationalFeePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ParentsModule } from '../parents/parents.module';
import { StudentsModule } from '../students/students.module';

const infrastructurePersistenceModule = RelationalFeePersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    forwardRef(() => ParentsModule),
    forwardRef(() => StudentsModule),
  ],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService, infrastructurePersistenceModule],
})
export class FeesModule {}
