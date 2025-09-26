import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import { NotificationModule } from '../notifications/notification.module';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { ParentsModule } from '../parents/parents.module';
import { AnnouncementEntity } from './infrastructure/persistence/relational/entities/announcement.entity';

@Module({
  imports: [NotificationModule, UsersModule, StudentsModule, ParentsModule, TypeOrmModule.forFeature([AnnouncementEntity])],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
