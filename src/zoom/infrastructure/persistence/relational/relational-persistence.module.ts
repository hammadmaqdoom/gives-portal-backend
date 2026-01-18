import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZoomCredentialsRepository } from '../zoom-credentials.repository';
import { ZoomMeetingRepository } from '../zoom-meeting.repository';
import { RelationalZoomCredentialsRepository } from './repositories/zoom-credentials.repository';
import { RelationalZoomMeetingRepository } from './repositories/zoom-meeting.repository';
import { ZoomCredentialsEntity } from './entities/zoom-credentials.entity';
import { ZoomMeetingEntity } from './entities/zoom-meeting.entity';
import { TeacherEntity } from '../../../../teachers/infrastructure/persistence/relational/entities/teacher.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ZoomCredentialsEntity, ZoomMeetingEntity, TeacherEntity]),
  ],
  providers: [
    {
      provide: ZoomCredentialsRepository,
      useClass: RelationalZoomCredentialsRepository,
    },
    {
      provide: ZoomMeetingRepository,
      useClass: RelationalZoomMeetingRepository,
    },
  ],
  exports: [ZoomCredentialsRepository, ZoomMeetingRepository],
})
export class RelationalZoomPersistenceModule {}
