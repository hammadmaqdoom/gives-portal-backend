import { Injectable } from '@nestjs/common';
import { SubmissionEntity } from '../entities/submission.entity';
import { Submission } from '../../../../domain/submission';
import { Student } from '../../../../../students/domain/student';
import { Assignment } from '../../../../domain/assignment';

@Injectable()
export class SubmissionMapper {
  toDomain(raw: SubmissionEntity): Submission {
    // console.log('Mapping submission entity:', raw);

    const submission = new Submission();
    submission.id = raw.id;
    submission.status = raw.status;
    submission.score = raw.score;
    submission.grade = raw.grade;
    submission.comments = raw.comments;
    submission.fileUrl = raw.fileUrl;
    // Convert comma-separated string back to array for domain model
    submission.attachments = raw.attachments 
      ? raw.attachments.split(',').filter(att => att.trim() !== '')
      : null;
    submission.submittedAt = raw.submittedAt;
    submission.gradedAt = raw.gradedAt;
    submission.createdAt = raw.createdAt;
    submission.updatedAt = raw.updatedAt;
    submission.deletedAt = raw.deletedAt;

    if (raw.student) {
      // console.log('Mapping student:', raw.student);
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
      console.log('No student data found in submission');
    }

    if (raw.assignment) {
      // console.log('Mapping assignment:', raw.assignment);
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
      } as Assignment;
    } else {
      console.log('No assignment data found in submission');
    }

    // console.log('Final mapped submission:', submission);
    return submission;
  }

  toPersistence(submission: Partial<Submission>): Partial<SubmissionEntity> {
    // console.log('Converting submission to persistence entity:', submission);

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
      submissionEntity.fileUrl = submission.fileUrl;
    }
    if (submission.attachments !== undefined) {
      // Convert array to comma-separated string for database storage
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
      console.log('Setting student relationship:', submission.student);
      submissionEntity.student = submission.student as any;
    }
    if (submission.assignment !== undefined) {
      console.log('Setting assignment relationship:', submission.assignment);
      submissionEntity.assignment = submission.assignment as any;
    }

    // console.log('Final persistence entity:', submissionEntity);
    return submissionEntity;
  }
}
