import { Injectable } from '@nestjs/common';
import { StudentEntity } from '../entities/student.entity';
import { Student } from '../../../../domain/student';
import { FileType } from '../../../../../files/domain/file';
import { User } from '../../../../../users/domain/user';
import { StudentClassEnrollment } from '../../../../domain/student-class-enrollment';

@Injectable()
export class StudentMapper {
  toDomain(raw: StudentEntity): Student {
    const student = new Student();
    student.id = raw.id;
    student.studentId = raw.studentId;
    student.name = raw.name;
    student.address = raw.address;
    student.city = raw.city;
    student.country = raw.country;
    student.dateOfBirth = raw.dateOfBirth;
    student.email = raw.email;
    student.contact = raw.contact;
    student.userId = raw.userId;
    student.createdAt = raw.createdAt;
    student.updatedAt = raw.updatedAt;
    student.deletedAt = raw.deletedAt;

    if (raw.photo) {
      student.photo = {
        id: raw.photo.id,
        path: raw.photo.path,
      } as FileType;
    }

    if (raw.user) {
      student.user = {
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

    // Handle class enrollments
    if (raw.classEnrollments && raw.classEnrollments.length > 0) {
      student.classes = raw.classEnrollments
        .filter((enrollment) => enrollment.status === 'active')
        .map((enrollment) => ({
          id: enrollment.class.id,
          name: enrollment.class.name,
          batchTerm: enrollment.class.batchTerm,
          weekdays: enrollment.class.weekdays || [],
          timing: enrollment.class.timing || '',
          timezone: enrollment.class.timezone || 'Asia/Karachi',
          courseOutline: enrollment.class.courseOutline,
          enrollmentDate: enrollment.enrollmentDate,
          enrollmentStatus: enrollment.status,
        }));
    }

    // Handle parent relationships
    if (raw.parentStudents && raw.parentStudents.length > 0) {
      student.parents = raw.parentStudents
        .filter((parentStudent) => parentStudent.status === 'active')
        .map((parentStudent) => ({
          id: parentStudent.parent.id,
          fullName: parentStudent.parent.fullName,
          mobile: parentStudent.parent.mobile,
          landline: parentStudent.parent.landline,
          address: parentStudent.parent.address,
          city: parentStudent.parent.city,
          country: parentStudent.parent.country,
          email: parentStudent.parent.email,
          relationship: parentStudent.parent.relationship,
          maritalStatus: parentStudent.parent.maritalStatus,
          status: parentStudent.status,
        }));
    }

    return student;
  }

  toPersistence(student: Partial<Student>): Partial<StudentEntity> {
    const studentEntity = new StudentEntity();

    if (student.id !== undefined) {
      studentEntity.id = student.id;
    }
    if (student.studentId !== undefined) {
      studentEntity.studentId = student.studentId;
    }
    if (student.name !== undefined) {
      studentEntity.name = student.name;
    }
    if (student.address !== undefined) {
      studentEntity.address = student.address;
    }
    if (student.city !== undefined) {
      studentEntity.city = student.city;
    }
    if (student.country !== undefined) {
      studentEntity.country = student.country;
    }
    if (student.dateOfBirth !== undefined) {
      studentEntity.dateOfBirth = student.dateOfBirth;
    }
    if (student.email !== undefined) {
      studentEntity.email = student.email;
    }
    if (student.contact !== undefined) {
      studentEntity.contact = student.contact;
    }
    if (student.userId !== undefined) {
      studentEntity.userId = student.userId;
    }

    return studentEntity;
  }
}
