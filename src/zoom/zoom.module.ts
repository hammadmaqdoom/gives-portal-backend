import { Module, forwardRef } from '@nestjs/common';
import { ZoomController } from './zoom.controller';
import { ZoomService } from './zoom.service';
import { RelationalZoomPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { SettingsModule } from '../settings/settings.module';

const infrastructurePersistenceModule = RelationalZoomPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    forwardRef(() => SettingsModule),
  ],
  controllers: [ZoomController],
  providers: [ZoomService],
  exports: [ZoomService, infrastructurePersistenceModule],
})
export class ZoomModule {}
