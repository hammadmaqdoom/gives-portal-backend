import { Injectable } from '@nestjs/common';
import { TeacherCommissionEntity } from '../entities/teacher-commission.entity';
import { TeacherCommission } from '../../../../domain/teacher-commission';
import { Teacher } from '../../../../domain/teacher';
import { Class } from '../../../../../classes/domain/class';
import { Student } from '../../../../../students/domain/student';

@Injectable()
export class TeacherCommissionMapper {
  toDomain(raw: TeacherCommissionEntity): TeacherCommission {
    const commission = new TeacherCommission();
    commission.id = raw.id;
    commission.amount = raw.amount;
    commission.commissionPercentage = raw.commissionPercentage;
    commission.commissionAmount = raw.commissionAmount;
    commission.status = raw.status as any;
    commission.dueDate = raw.dueDate;
    commission.paidAt = raw.paidAt;
    commission.description = raw.description;
    commission.transactionId = raw.transactionId;
    commission.createdAt = raw.createdAt;
    commission.updatedAt = raw.updatedAt;
    commission.deletedAt = raw.deletedAt;

    if (raw.teacher) {
      commission.teacher = {
        id: raw.teacher.id,
        name: raw.teacher.name,
        email: raw.teacher.email,
        phone: raw.teacher.phone,
        commissionPercentage: raw.teacher.commissionPercentage,
        subjectsAllowed: raw.teacher.subjectsAllowed,
        payoutMethod: raw.teacher.payoutMethod,
        bankName: raw.teacher.bankName,
        accountNumber: raw.teacher.accountNumber,
        bankCode: raw.teacher.bankCode,
        accountHolderName: raw.teacher.accountHolderName,
        bankBranch: raw.teacher.bankBranch,
        createdAt: raw.teacher.createdAt,
        updatedAt: raw.teacher.updatedAt,
        deletedAt: raw.teacher.deletedAt,
      } as Teacher;
    }

    if (raw.class) {
      commission.class = {
        id: raw.class.id,
        name: raw.class.name,
        batchTerm: raw.class.batchTerm,
        weekdays: raw.class.weekdays,
        timing: raw.class.timing,
        timezone: raw.class.timezone,
        courseOutline: raw.class.courseOutline,
        feeUSD: raw.class.feeUSD,
        feePKR: raw.class.feePKR,
        classMode: raw.class.classMode,
        createdAt: raw.class.createdAt,
        updatedAt: raw.class.updatedAt,
        deletedAt: raw.class.deletedAt,
      } as Class;
    }

    if (raw.student) {
      commission.student = {
        id: raw.student.id,
        name: raw.student.name,
        studentId: raw.student.studentId,
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
    }

    return commission;
  }

  toPersistence(
    commission: Partial<TeacherCommission>,
  ): Partial<TeacherCommissionEntity> {
    const commissionEntity = new TeacherCommissionEntity();

    if (commission.id !== undefined) {
      commissionEntity.id = commission.id;
    }
    if (commission.amount !== undefined) {
      commissionEntity.amount = commission.amount;
    }
    if (commission.commissionPercentage !== undefined) {
      commissionEntity.commissionPercentage = commission.commissionPercentage;
    }
    if (commission.commissionAmount !== undefined) {
      commissionEntity.commissionAmount = commission.commissionAmount;
    }
    if (commission.status !== undefined) {
      commissionEntity.status = commission.status as any;
    }
    if (commission.dueDate !== undefined) {
      commissionEntity.dueDate = commission.dueDate;
    }
    if (commission.paidAt !== undefined) {
      commissionEntity.paidAt = commission.paidAt;
    }
    if (commission.description !== undefined) {
      commissionEntity.description = commission.description;
    }
    if (commission.transactionId !== undefined) {
      commissionEntity.transactionId = commission.transactionId;
    }

    return commissionEntity;
  }
}
