import { Injectable } from '@nestjs/common';
import { AttendanceEntity } from '../entities/attendance.entity';
import { Attendance } from '../../../../domain/attendance';
import { Student } from '../../../../../students/domain/student';
import { Class } from '../../../../../classes/domain/class';

@Injectable()
export class AttendanceMapper {
  toDomain(raw: AttendanceEntity): Attendance {
    const attendance = new Attendance();
    attendance.id = raw.id;
    attendance.date = raw.date;
    attendance.status = raw.status;
    attendance.notes = raw.notes;
    attendance.createdAt = raw.createdAt;
    attendance.updatedAt = raw.updatedAt;
    attendance.deletedAt = raw.deletedAt;

    if (raw.student) {
      attendance.student = {
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
      attendance.class = {
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

    return attendance;
  }

  toPersistence(attendance: Partial<Attendance>): Partial<AttendanceEntity> {
    const attendanceEntity = new AttendanceEntity();

    if (attendance.id !== undefined) {
      attendanceEntity.id = attendance.id;
    }
    if (attendance.date !== undefined) {
      attendanceEntity.date = attendance.date;
    }
    if (attendance.status !== undefined) {
      attendanceEntity.status = attendance.status;
    }
    if (attendance.notes !== undefined) {
      attendanceEntity.notes = attendance.notes;
    }
    if (attendance.student !== undefined) {
      attendanceEntity.student = attendance.student as any;
    }
    if (attendance.class !== undefined) {
      attendanceEntity.class = attendance.class as any;
    }

    return attendanceEntity;
  }
}
