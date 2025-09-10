import { Injectable } from '@nestjs/common';
import { NotificationService } from '../notifications/notification.service';
import { UsersService } from '../users/users.service';
import { StudentsService } from '../students/students.service';
import { ParentsService } from '../parents/parents.service';

export interface CreateAnnouncementDto {
  title: string;
  message: string;
  authorId: number;
  targetAudience: 'all' | 'students' | 'parents' | 'teachers';
}

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
    private readonly parentsService: ParentsService,
  ) {}

  async createAnnouncement(createAnnouncementDto: CreateAnnouncementDto): Promise<void> {
    try {
      // Get author details
      const author = await this.usersService.findById(createAnnouncementDto.authorId);
      if (!author) {
        throw new Error('Author not found');
      }

      const authorName = author.firstName ? `${author.firstName} ${author.lastName || ''}`.trim() : (author.email || 'Unknown Author');
      const postDate = new Date().toLocaleDateString();

      // Send notifications based on target audience
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
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  private async sendToAllUsers(announcement: CreateAnnouncementDto, authorName: string, postDate: string): Promise<void> {
    // Get all users with email addresses
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

  private async sendToStudents(announcement: CreateAnnouncementDto, authorName: string, postDate: string): Promise<void> {
    // Get all students
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
          console.error(`Error sending announcement to student ${student.email}:`, error);
        }
      }
    }
  }

  private async sendToParents(announcement: CreateAnnouncementDto, authorName: string, postDate: string): Promise<void> {
    // Get all parents
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
          console.error(`Error sending announcement to parent ${parent.email}:`, error);
        }
      }
    }
  }

  private async sendToTeachers(announcement: CreateAnnouncementDto, authorName: string, postDate: string): Promise<void> {
    // Get all users with teacher role
    const users = await this.usersService.findManyWithPagination({
      filterOptions: {},
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
    });

    const teachers = users.filter(user => user.role?.name === 'teacher');

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
          console.error(`Error sending announcement to teacher ${teacher.email}:`, error);
        }
      }
    }
  }
}