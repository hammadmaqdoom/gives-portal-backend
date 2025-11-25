import { Injectable } from '@nestjs/common';
import { PerformanceEntity } from '../entities/performance.entity';
import { Performance } from '../../../../domain/performance';
import { Student } from '../../../../../students/domain/student';
import { Assignment } from '../../../../../assignments/domain/assignment';

@Injectable()
export class PerformanceMapper {
  toDomain(raw: PerformanceEntity): Performance {
    const performance = new Performance();
    performance.id = raw.id;
    performance.score = raw.score;
    performance.comments = raw.comments;
    performance.grade = raw.grade;
    performance.submittedAt = raw.submittedAt;
    performance.gradedAt = raw.gradedAt;
    performance.createdAt = raw.createdAt;
    performance.updatedAt = raw.updatedAt;
    performance.deletedAt = raw.deletedAt;

    if (raw.student) {
      performance.student = {
        id: raw.student.id,
        studentId: raw.student.studentId,
        name: raw.student.name,
        address: raw.student.address,
        contact: raw.student.contact,
        createdAt: raw.student.createdAt,
        updatedAt: raw.student.updatedAt,
        deletedAt: raw.student.deletedAt,
      } as Student;
    }

    if (raw.assignment) {
      performance.assignment = {
        id: raw.assignment.id,
        title: raw.assignment.title,
        description: raw.assignment.description,
        dueDate: raw.assignment.dueDate,
        type: raw.assignment.type,
        maxScore: raw.assignment.maxScore,
        createdAt: raw.assignment.createdAt,
        updatedAt: raw.assignment.updatedAt,
        deletedAt: raw.assignment.deletedAt,
      } as Assignment;
    }

    return performance;
  }

  toPersistence(performance: Partial<Performance>): Partial<PerformanceEntity> {
    const performanceEntity = new PerformanceEntity();

    if (performance.id !== undefined) {
      performanceEntity.id = performance.id;
    }
    if (performance.score !== undefined) {
      performanceEntity.score = performance.score;
    }
    if (performance.comments !== undefined) {
      performanceEntity.comments = performance.comments;
    }
    if (performance.grade !== undefined) {
      performanceEntity.grade = performance.grade;
    }
    if (performance.submittedAt !== undefined) {
      performanceEntity.submittedAt = performance.submittedAt;
    }
    if (performance.gradedAt !== undefined) {
      performanceEntity.gradedAt = performance.gradedAt;
    }

    return performanceEntity;
  }
}
