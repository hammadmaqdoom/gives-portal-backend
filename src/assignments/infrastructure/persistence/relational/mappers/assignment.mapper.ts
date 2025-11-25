import { Injectable } from '@nestjs/common';
import { AssignmentEntity } from '../entities/assignment.entity';
import { Assignment } from '../../../../domain/assignment';
import { Class } from '../../../../../classes/domain/class';

@Injectable()
export class AssignmentMapper {
  toDomain(raw: AssignmentEntity): Assignment {
    const assignment = new Assignment();
    assignment.id = raw.id;
    assignment.title = raw.title;
    assignment.description = raw.description;
    assignment.dueDate = raw.dueDate;
    assignment.type = raw.type;
    assignment.status = raw.status;
    assignment.maxScore = raw.maxScore;
    assignment.markingCriteria = raw.markingCriteria;
    assignment.attachments = raw.attachments;
    assignment.createdAt = raw.createdAt;
    assignment.updatedAt = raw.updatedAt;
    assignment.deletedAt = raw.deletedAt;

    if (raw.class) {
      assignment.class = {
        id: raw.class.id,
        name: raw.class.name,
        batchTerm: raw.class.batchTerm,
        weekdays: raw.class.weekdays,
        timing: raw.class.timing,
        courseOutline: raw.class.courseOutline,
        createdAt: raw.class.createdAt,
        updatedAt: raw.class.updatedAt,
        deletedAt: raw.class.deletedAt,
      } as Class;
    }

    return assignment;
  }

  toPersistence(assignment: Partial<Assignment>): Partial<AssignmentEntity> {
    const assignmentEntity = new AssignmentEntity();

    if (assignment.id !== undefined) {
      assignmentEntity.id = assignment.id;
    }
    if (assignment.title !== undefined) {
      assignmentEntity.title = assignment.title;
    }
    if (assignment.description !== undefined) {
      assignmentEntity.description = assignment.description;
    }
    if (assignment.dueDate !== undefined) {
      assignmentEntity.dueDate = assignment.dueDate;
    }
    if (assignment.type !== undefined) {
      assignmentEntity.type = assignment.type;
    }
    if (assignment.status !== undefined) {
      assignmentEntity.status = assignment.status;
    }
    if (assignment.maxScore !== undefined) {
      assignmentEntity.maxScore = assignment.maxScore;
    }
    if (assignment.markingCriteria !== undefined) {
      assignmentEntity.markingCriteria = assignment.markingCriteria;
    }
    if (assignment.attachments !== undefined) {
      assignmentEntity.attachments = assignment.attachments;
    }

    return assignmentEntity;
  }
}
