import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../notifications/notification.service';
import { UsersService } from '../users/users.service';
import { StudentsService } from '../students/students.service';
import { ParentsService } from '../parents/parents.service';
import { AnnouncementEntity } from './infrastructure/persistence/relational/entities/announcement.entity';

export interface CreateAnnouncementDto {
  title: string;
  message: string;
  authorId: number;
  targetAudience: 'all' | 'students' | 'parents' | 'teachers';
  classId?: number;
  pinned?: boolean;
}

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
    private readonly parentsService: ParentsService,
    @InjectRepository(AnnouncementEntity)
    private readonly announcementRepo: Repository<AnnouncementEntity>,
  ) {}

  async createAnnouncement(
    createAnnouncementDto: CreateAnnouncementDto,
  ): Promise<AnnouncementEntity> {
    // Notify
    // Get author details
    const author = await this.usersService.findById(
      createAnnouncementDto.authorId,
    );
    const authorName = author?.firstName
      ? `${author.firstName} ${author.lastName || ''}`.trim()
      : author?.email || 'Unknown Author';
    const postDate = new Date().toLocaleDateString();

    switch (createAnnouncementDto.targetAudience) {
      case 'all':
        await this.sendToAllUsers(createAnnouncementDto, authorName, postDate);
        break;
      case 'students':
        await this.sendToStudents(createAnnouncementDto, authorName, postDate);
        break;
      case 'parents':
        await this.sendToParents(createAnnouncementDto, authorName, postDate);
        break;
      case 'teachers':
        await this.sendToTeachers(createAnnouncementDto, authorName, postDate);
        break;
    }

    // Persist
    const entity = this.announcementRepo.create({
      title: createAnnouncementDto.title,
      bodyHtml: createAnnouncementDto.message,
      pinned: !!createAnnouncementDto.pinned,
      class: createAnnouncementDto.classId
        ? ({ id: createAnnouncementDto.classId } as any)
        : null,
    });
    return await this.announcementRepo.save(entity);
  }

  async listAnnouncements(classId?: number): Promise<AnnouncementEntity[]> {
    if (classId) {
      // Include class-specific and global (no class) announcements
      return this.announcementRepo.find({
        where: [{ class: { id: classId } } as any, { class: null } as any],
        order: { createdAt: 'DESC' },
      });
    }
    return this.announcementRepo.find({ order: { createdAt: 'DESC' } });
  }

  private async sendToAllUsers(
    announcement: CreateAnnouncementDto,
    authorName: string,
    postDate: string,
  ): Promise<void> {
    const users = await this.usersService.findManyWithPagination({
      filterOptions: {},
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
    });

    for (const user of users) {
      if (user.email) {
        try {
          await this.notificationService.sendAnnouncementNotification({
            to: user.email,
            recipientName: user.firstName || user.email,
            title: announcement.title,
            message: announcement.message,
            authorName,
            postDate,
          });
        } catch (error) {
          console.error(`Error sending announcement to ${user.email}:`, error);
        }
      }
    }
  }

  private async sendToStudents(
    announcement: CreateAnnouncementDto,
    authorName: string,
    postDate: string,
  ): Promise<void> {
    const students = await this.studentsService.findManyWithPagination({
      filterOptions: {},
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
    });

    for (const student of students) {
      if (student.email) {
        try {
          await this.notificationService.sendAnnouncementNotification({
            to: student.email,
            recipientName: student.name,
            title: announcement.title,
            message: announcement.message,
            authorName,
            postDate,
          });
        } catch (error) {
          console.error(
            `Error sending announcement to student ${student.email}:`,
            error,
          );
        }
      }
    }
  }

  private async sendToParents(
    announcement: CreateAnnouncementDto,
    authorName: string,
    postDate: string,
  ): Promise<void> {
    const parents = await this.parentsService.findManyWithPagination({
      filterOptions: {},
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
    });

    for (const parent of parents) {
      if (parent.email) {
        try {
          await this.notificationService.sendAnnouncementNotification({
            to: parent.email,
            recipientName: parent.fullName,
            title: announcement.title,
            message: announcement.message,
            authorName,
            postDate,
          });
        } catch (error) {
          console.error(
            `Error sending announcement to parent ${parent.email}:`,
            error,
          );
        }
      }
    }
  }

  private async sendToTeachers(
    announcement: CreateAnnouncementDto,
    authorName: string,
    postDate: string,
  ): Promise<void> {
    const users = await this.usersService.findManyWithPagination({
      filterOptions: {},
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
    });

    const teachers = users.filter((user) => user.role?.name === 'teacher');

    for (const teacher of teachers) {
      if (teacher.email) {
        try {
          await this.notificationService.sendAnnouncementNotification({
            to: teacher.email,
            recipientName: teacher.firstName || teacher.email,
            title: announcement.title,
            message: announcement.message,
            authorName,
            postDate,
          });
        } catch (error) {
          console.error(
            `Error sending announcement to teacher ${teacher.email}:`,
            error,
          );
        }
      }
    }
  }
}
