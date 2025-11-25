import { Injectable } from '@nestjs/common';
import { FeeEntity } from '../entities/fee.entity';
import { Fee } from '../../../../domain/fee';
import { Student } from '../../../../../students/domain/student';
import { Class } from '../../../../../classes/domain/class';

@Injectable()
export class FeeMapper {
  toDomain(raw: FeeEntity): Fee {
    const fee = new Fee();
    fee.id = raw.id;
    fee.amount = Number(raw.amount);
    fee.status = raw.status;
    fee.paymentMethod = raw.paymentMethod;
    fee.transactionId = raw.transactionId;
    fee.dueDate = raw.dueDate;
    fee.paidAt = raw.paidAt;
    fee.description = raw.description;
    fee.createdAt = raw.createdAt;
    fee.updatedAt = raw.updatedAt;
    fee.deletedAt = raw.deletedAt;

    if (raw.student) {
      fee.student = {
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

    if (raw.class) {
      fee.class = {
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

    return fee;
  }

  toPersistence(fee: Partial<Fee>): Partial<FeeEntity> {
    const feeEntity = new FeeEntity();

    if (fee.id !== undefined) {
      feeEntity.id = fee.id;
    }
    if (fee.amount !== undefined) {
      feeEntity.amount = fee.amount;
    }
    if (fee.status !== undefined) {
      feeEntity.status = fee.status;
    }
    if (fee.paymentMethod !== undefined) {
      feeEntity.paymentMethod = fee.paymentMethod;
    }
    if (fee.transactionId !== undefined) {
      feeEntity.transactionId = fee.transactionId;
    }
    if (fee.dueDate !== undefined) {
      feeEntity.dueDate = fee.dueDate;
    }
    if (fee.paidAt !== undefined) {
      feeEntity.paidAt = fee.paidAt;
    }
    if (fee.description !== undefined) {
      feeEntity.description = fee.description;
    }

    return feeEntity;
  }
}
