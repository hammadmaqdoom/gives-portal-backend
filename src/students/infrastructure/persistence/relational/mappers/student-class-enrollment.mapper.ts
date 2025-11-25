import { Injectable } from '@nestjs/common';
import { StudentClassEnrollmentEntity } from '../entities/student-class-enrollment.entity';
import { StudentClassEnrollment } from '../../../../domain/student-class-enrollment';
import { Student } from '../../../../domain/student';
import { Class } from '../../../../../classes/domain/class';

@Injectable()
export class StudentClassEnrollmentMapper {
  toDomain(raw: StudentClassEnrollmentEntity): StudentClassEnrollment {
    const enrollment = new StudentClassEnrollment();
    enrollment.id = raw.id;
    enrollment.studentId = raw.studentId;
    enrollment.classId = raw.classId;
    enrollment.enrollmentDate = raw.enrollmentDate;
    enrollment.status = raw.status;
    enrollment.createdAt = raw.createdAt;
    enrollment.updatedAt = raw.updatedAt;
    enrollment.deletedAt = raw.deletedAt;

    if (raw.student) {
      enrollment.student = {
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
      enrollment.class = {
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

    return enrollment;
  }

  toPersistence(
    enrollment: Partial<StudentClassEnrollment>,
  ): Partial<StudentClassEnrollmentEntity> {
    const enrollmentEntity = new StudentClassEnrollmentEntity();

    if (enrollment.id !== undefined) {
      enrollmentEntity.id = enrollment.id;
    }
    if (enrollment.studentId !== undefined) {
      enrollmentEntity.studentId = enrollment.studentId;
    }
    if (enrollment.classId !== undefined) {
      enrollmentEntity.classId = enrollment.classId;
    }
    if (enrollment.enrollmentDate !== undefined) {
      enrollmentEntity.enrollmentDate = enrollment.enrollmentDate;
    }
    if (enrollment.status !== undefined) {
      enrollmentEntity.status = enrollment.status;
    }

    return enrollmentEntity;
  }
}
