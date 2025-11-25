import { Module } from '@nestjs/common';
import { ZoomController } from './zoom.controller';
import { ZoomService } from './zoom.service';
import { RelationalZoomPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

const infrastructurePersistenceModule = RelationalZoomPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [ZoomController],
  providers: [ZoomService],
  exports: [ZoomService, infrastructurePersistenceModule],
})
export class ZoomModule {}
