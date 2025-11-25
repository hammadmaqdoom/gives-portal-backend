import { Injectable } from '@nestjs/common';
import { ParentEntity } from '../entities/parent.entity';
import { Parent } from '../../../../domain/parent';
import { User } from '../../../../../users/domain/user';

@Injectable()
export class ParentMapper {
  toDomain(raw: ParentEntity): Parent {
    const parent = new Parent();
    parent.id = raw.id;
    parent.fullName = raw.fullName;
    parent.mobile = raw.mobile;
    parent.landline = raw.landline;
    parent.address = raw.address;
    parent.city = raw.city;
    parent.country = raw.country;
    parent.email = raw.email;
    parent.relationship = raw.relationship;
    parent.maritalStatus = raw.maritalStatus;
    parent.passcode = raw.passcode;
    parent.createdAt = raw.createdAt;
    parent.updatedAt = raw.updatedAt;
    parent.deletedAt = raw.deletedAt;

    if (raw.user) {
      parent.user = {
        id: raw.user.id,
        email: raw.user.email,
        firstName: raw.user.firstName,
        lastName: raw.user.lastName,
        role: raw.user.role,
        status: raw.user.status,
        createdAt: raw.user.createdAt,
        updatedAt: raw.user.updatedAt,
        deletedAt: raw.user.deletedAt,
      } as User;
    }

    // Handle student relationships with proper null checks
    if (raw.parentStudents && raw.parentStudents.length > 0) {
      parent.students = raw.parentStudents
        .filter(
          (parentStudent) =>
            parentStudent.status === 'active' &&
            parentStudent.student &&
            parentStudent.student.id,
        )
        .map((parentStudent) => ({
          id: parentStudent.student.id,
          name: parentStudent.student.name,
          studentId: parentStudent.student.studentId,
          status: parentStudent.status,
        }));
    }

    return parent;
  }

  toPersistence(parent: Partial<Parent>): Partial<ParentEntity> {
    const parentEntity = new ParentEntity();

    if (parent.id !== undefined) {
      parentEntity.id = parent.id;
    }
    if (parent.fullName !== undefined) {
      parentEntity.fullName = parent.fullName;
    }
    if (parent.mobile !== undefined) {
      parentEntity.mobile = parent.mobile;
    }
    if (parent.landline !== undefined) {
      parentEntity.landline = parent.landline;
    }
    if (parent.address !== undefined) {
      parentEntity.address = parent.address;
    }
    if (parent.city !== undefined) {
      parentEntity.city = parent.city;
    }
    if (parent.country !== undefined) {
      parentEntity.country = parent.country;
    }
    if (parent.email !== undefined) {
      parentEntity.email = parent.email;
    }
    if (parent.relationship !== undefined) {
      parentEntity.relationship = parent.relationship;
    }
    if (parent.maritalStatus !== undefined) {
      parentEntity.maritalStatus = parent.maritalStatus;
    }
    if (parent.passcode !== undefined) {
      parentEntity.passcode = parent.passcode;
    }

    return parentEntity;
  }
}
