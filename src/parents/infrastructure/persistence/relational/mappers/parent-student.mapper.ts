import { Injectable } from '@nestjs/common';
import { ParentStudentEntity } from '../entities/parent-student.entity';
import { ParentStudent } from '../../../../domain/parent-student';

@Injectable()
export class ParentStudentMapper {
  toDomain(raw: ParentStudentEntity): ParentStudent {
    const parentStudent = new ParentStudent();
    parentStudent.id = raw.id;
    parentStudent.parentId = raw.parentId;
    parentStudent.studentId = raw.studentId;
    parentStudent.status = raw.status;
    parentStudent.createdAt = raw.createdAt;
    parentStudent.updatedAt = raw.updatedAt;
    parentStudent.deletedAt = raw.deletedAt;

    if (raw.parent) {
      parentStudent.parent = raw.parent;
    }

    if (raw.student) {
      parentStudent.student = raw.student;
    }

    return parentStudent;
  }

  toPersistence(domain: Partial<ParentStudent>): Partial<ParentStudentEntity> {
    const parentStudentEntity = new ParentStudentEntity();

    if (domain.id !== undefined) {
      parentStudentEntity.id = domain.id;
    }
    if (domain.parentId !== undefined) {
      parentStudentEntity.parentId = domain.parentId;
    }
    if (domain.studentId !== undefined) {
      parentStudentEntity.studentId = domain.studentId;
    }
    if (domain.status !== undefined) {
      parentStudentEntity.status = domain.status;
    }
    if (domain.createdAt !== undefined) {
      parentStudentEntity.createdAt = domain.createdAt;
    }
    if (domain.updatedAt !== undefined) {
      parentStudentEntity.updatedAt = domain.updatedAt;
    }
    if (domain.deletedAt !== undefined) {
      parentStudentEntity.deletedAt = domain.deletedAt;
    }

    return parentStudentEntity;
  }
}
