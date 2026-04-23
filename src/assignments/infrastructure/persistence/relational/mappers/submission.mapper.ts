import { Injectable, Logger } from '@nestjs/common';
import { SubmissionEntity } from '../entities/submission.entity';
import { Submission } from '../../../../domain/submission';
import { Student } from '../../../../../students/domain/student';
import { Assignment } from '../../../../domain/assignment';

@Injectable()
export class SubmissionMapper {
  private readonly logger = new Logger(SubmissionMapper.name);

  toDomain(raw: SubmissionEntity): Submission {
    const submission = new Submission();
    submission.id = raw.id;
    submission.status = raw.status;
    submission.score = raw.score;
    submission.grade = raw.grade;
    submission.comments = raw.comments;
    submission.fileUrl = raw.fileUrl;
    // Convert comma-separated string back to array for domain model.
    // These values are expected to be internal file refs (ids/paths), not raw S3/Blaze URLs.
    submission.attachments = raw.attachments
      ? raw.attachments.split(',').map((att) => att.trim()).filter((att) => att !== '')
      : null;
    submission.submittedAt = raw.submittedAt;
    submission.gradedAt = raw.gradedAt;
    submission.createdAt = raw.createdAt;
    submission.updatedAt = raw.updatedAt;
    submission.deletedAt = raw.deletedAt;

    if (raw.student) {
      submission.student = {
        id: raw.student.id,
        name: raw.student.name,
        email: raw.student.email,
        contact: raw.student.contact,
        address: raw.student.address,
        city: raw.student.city,
        country: raw.student.country,
        dateOfBirth: raw.student.dateOfBirth,
        createdAt: raw.student.createdAt,
        updatedAt: raw.student.updatedAt,
        deletedAt: raw.student.deletedAt,
      } as Student;
    } else {
      this.logger.verbose(`Submission id=${raw.id} missing student relation`);
    }

    if (raw.assignment) {
      submission.assignment = {
        id: raw.assignment.id,
        title: raw.assignment.title,
        description: raw.assignment.description,
        dueDate: raw.assignment.dueDate,
        type: raw.assignment.type,
        status: raw.assignment.status,
        maxScore: raw.assignment.maxScore,
        markingCriteria: raw.assignment.markingCriteria,
        attachments: raw.assignment.attachments,
        createdAt: raw.assignment.createdAt,
        updatedAt: raw.assignment.updatedAt,
        deletedAt: raw.assignment.deletedAt,
        class: raw.assignment.class ? { id: raw.assignment.class.id } : undefined,
      } as Assignment;
    } else {
      this.logger.verbose(`Submission id=${raw.id} missing assignment relation`);
    }

    return submission;
  }

  toPersistence(submission: Partial<Submission>): Partial<SubmissionEntity> {
    const submissionEntity = new SubmissionEntity();

    if (submission.id !== undefined) {
      submissionEntity.id = submission.id;
    }
    if (submission.status !== undefined) {
      submissionEntity.status = submission.status;
    }
    if (submission.score !== undefined) {
      submissionEntity.score = submission.score;
    }
    if (submission.grade !== undefined) {
      submissionEntity.grade = submission.grade;
    }
    if (submission.comments !== undefined) {
      submissionEntity.comments = submission.comments;
    }
    if (submission.fileUrl !== undefined) {
      // Only persist internal references (ids/paths). If callers mistakenly pass full URLs,
      // they should be filtered out at the service/DTO layer.
      submissionEntity.fileUrl = submission.fileUrl;
    }
    if (submission.attachments !== undefined) {
      // Convert array to comma-separated string for database storage.
      // Values should be internal refs (ids/paths), not provider-specific URLs.
      submissionEntity.attachments = Array.isArray(submission.attachments)
        ? submission.attachments.join(',')
        : submission.attachments;
    }
    if (submission.assignment !== undefined) {
      submissionEntity.assignment = submission.assignment as any;
    }
    if (submission.submittedAt !== undefined) {
      submissionEntity.submittedAt = submission.submittedAt;
    }
    if (submission.gradedAt !== undefined) {
      submissionEntity.gradedAt = submission.gradedAt;
    }
    if (submission.student !== undefined) {
      submissionEntity.student = submission.student as any;
    }
    if (submission.assignment !== undefined) {
      submissionEntity.assignment = submission.assignment as any;
    }

    return submissionEntity;
  }
}
