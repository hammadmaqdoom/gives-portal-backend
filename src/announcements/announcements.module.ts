import { Module } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { NotificationModule } from '../notifications/notification.module';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { ParentsModule } from '../parents/parents.module';

@Module({
  imports: [
    NotificationModule,
    UsersModule,
    StudentsModule,
    ParentsModule,
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}