import { Injectable } from '@nestjs/common';
import { TeacherEntity } from '../entities/teacher.entity';
import { Teacher } from '../../../../domain/teacher';
import { FileMapper } from '../../../../../files/infrastructure/persistence/relational/mappers/file.mapper';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';

@Injectable()
export class TeacherMapper {
  constructor(private fileMapper: FileMapper) {}

  toDomain(raw: TeacherEntity): Teacher {
    const teacher = new Teacher();
    teacher.id = raw.id;
    teacher.name = raw.name;
    teacher.email = raw.email;
    teacher.phone = raw.phone;
    teacher.commissionPercentage = raw.commissionPercentage;
    teacher.subjectsAllowed = raw.subjectsAllowed;
    teacher.payoutMethod = raw.payoutMethod;
    teacher.bankName = raw.bankName;
    teacher.accountNumber = raw.accountNumber;
    teacher.bankCode = raw.bankCode;
    teacher.iban = raw.iban;
    teacher.accountHolderName = raw.accountHolderName;
    teacher.bankBranch = raw.bankBranch;
    teacher.photo = raw.photo ? this.fileMapper.toDomain(raw.photo) : null;
    teacher.bio = raw.bio;
    teacher.showOnPublicSite = raw.showOnPublicSite;
    teacher.displayOrder = raw.displayOrder;
    teacher.createdAt = raw.createdAt;
    teacher.updatedAt = raw.updatedAt;
    teacher.deletedAt = raw.deletedAt;
    return teacher;
  }

  toPersistence(teacher: Partial<Teacher>): Partial<TeacherEntity> {
    const teacherEntity = new TeacherEntity();

    if (teacher.id !== undefined) {
      teacherEntity.id = teacher.id;
    }
    if (teacher.name !== undefined) {
      teacherEntity.name = teacher.name;
    }
    if (teacher.email !== undefined) {
      teacherEntity.email = teacher.email;
    }
    if (teacher.phone !== undefined) {
      teacherEntity.phone = teacher.phone;
    }
    if (teacher.commissionPercentage !== undefined) {
      teacherEntity.commissionPercentage = teacher.commissionPercentage;
    }
    if (teacher.subjectsAllowed !== undefined) {
      teacherEntity.subjectsAllowed = teacher.subjectsAllowed;
    }
    if (teacher.payoutMethod !== undefined) {
      teacherEntity.payoutMethod = teacher.payoutMethod;
    }
    if (teacher.bankName !== undefined) {
      teacherEntity.bankName = teacher.bankName;
    }
    if (teacher.accountNumber !== undefined) {
      teacherEntity.accountNumber = teacher.accountNumber;
    }
    if (teacher.bankCode !== undefined) {
      teacherEntity.bankCode = teacher.bankCode;
    }
    if (teacher.iban !== undefined) {
      teacherEntity.iban = teacher.iban;
    }
    if (teacher.accountHolderName !== undefined) {
      teacherEntity.accountHolderName = teacher.accountHolderName;
    }
    if (teacher.bankBranch !== undefined) {
      teacherEntity.bankBranch = teacher.bankBranch;
    }
    if (teacher.photo !== undefined) {
      teacherEntity.photo = teacher.photo
        ? ({ id: teacher.photo.id } as FileEntity)
        : null;
    }
    if (teacher.bio !== undefined) {
      teacherEntity.bio = teacher.bio;
    }
    if (teacher.showOnPublicSite !== undefined) {
      teacherEntity.showOnPublicSite = teacher.showOnPublicSite;
    }
    if (teacher.displayOrder !== undefined) {
      teacherEntity.displayOrder = teacher.displayOrder;
    }

    return teacherEntity;
  }
}
