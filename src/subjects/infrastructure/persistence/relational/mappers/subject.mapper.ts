import { Injectable } from '@nestjs/common';
import { SubjectEntity } from '../entities/subject.entity';
import { Subject } from '../../../../domain/subject';

@Injectable()
export class SubjectMapper {
  toDomain(raw: SubjectEntity): Subject {
    const subject = new Subject();
    subject.id = raw.id;
    subject.name = raw.name;
    subject.description = raw.description;
    subject.createdAt = raw.createdAt;
    subject.updatedAt = raw.updatedAt;
    subject.deletedAt = raw.deletedAt;
    return subject;
  }

  toPersistence(subject: Partial<Subject>): Partial<SubjectEntity> {
    const subjectEntity = new SubjectEntity();

    if (subject.id !== undefined) {
      subjectEntity.id = subject.id;
    }
    if (subject.name !== undefined) {
      subjectEntity.name = subject.name;
    }
    if (subject.description !== undefined) {
      subjectEntity.description = subject.description;
    }

    return subjectEntity;
  }
}
