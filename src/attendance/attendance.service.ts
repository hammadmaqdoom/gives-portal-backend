import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterAttendanceDto,
  SortAttendanceDto,
} from './dto/query-attendance.dto';
import { AttendanceRepository } from './infrastructure/persistence/attendance.repository';
import { Attendance } from './domain/attendance';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly attendanceRepository: AttendanceRepository) {}

  async create(createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    // Check if attendance already exists for this student and date
    const existingAttendance =
      await this.attendanceRepository.findByStudentAndDate(
        createAttendanceDto.student,
        createAttendanceDto.date,
      );

    if (existingAttendance) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          attendance: 'attendanceAlreadyExistsForDate',
        },
      });
    }

    // Transform DTO to domain format
    const attendanceData: Partial<Attendance> = {
      date: createAttendanceDto.date,
      status: createAttendanceDto.status,
      notes: createAttendanceDto.notes,
      student: { id: createAttendanceDto.student } as any,
      class: { id: createAttendanceDto.class } as any,
    };

    return this.attendanceRepository.create(attendanceData);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterAttendanceDto | null;
    sortOptions?: SortAttendanceDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Attendance[]> {
    return this.attendanceRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Attendance['id']): Promise<NullableType<Attendance>> {
    return this.attendanceRepository.findById(id);
  }

  async findByStudentAndDate(
    studentId: number,
    date: Date,
  ): Promise<NullableType<Attendance>> {
    return this.attendanceRepository.findByStudentAndDate(studentId, date);
  }

  async findByClassAndDate(classId: number, date: Date): Promise<Attendance[]> {
    return this.attendanceRepository.findByClassAndDate(classId, date);
  }

  async findByDate(
    date: Date,
    classId?: number,
    studentId?: number,
  ): Promise<Attendance[] | NullableType<Attendance>> {
    if (studentId) {
      return this.attendanceRepository.findByStudentAndDate(studentId, date);
    }
    if (classId) {
      return this.attendanceRepository.findByClassAndDate(classId, date);
    }
    // fallback: list page for that date
    return this.attendanceRepository.findManyWithPagination({
      filterOptions: { date } as any,
      sortOptions: null,
      paginationOptions: { page: 1, limit: 100 },
    });
  }

  async update(
    id: Attendance['id'],
    updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<Attendance | null> {
    // Transform DTO to domain format
    const attendanceData: Partial<Attendance> = {
      ...updateAttendanceDto,
      student: updateAttendanceDto.student
        ? ({ id: updateAttendanceDto.student } as any)
        : undefined,
      class: updateAttendanceDto.class
        ? ({ id: updateAttendanceDto.class } as any)
        : undefined,
    };

    return this.attendanceRepository.update(id, attendanceData);
  }

  async remove(id: Attendance['id']): Promise<void> {
    await this.attendanceRepository.remove(id);
  }

  async bulkUpdate(
    items: Array<Partial<Attendance> & { id?: number }>,
  ): Promise<{ updated: number; created: number }> {
    let updated = 0;
    let created = 0;
    for (const item of items) {
      if (item.id) {
        await this.attendanceRepository.update(item.id, item);
        updated += 1;
      } else if (item.student && item.class && item.date) {
        const existing = await this.attendanceRepository.findByStudentAndDate(
          (item.student as any).id ?? (item as any).student,
          item.date as any,
        );
        if (existing) {
          await this.attendanceRepository.update(existing.id, item);
          updated += 1;
        } else {
          await this.attendanceRepository.create(item);
          created += 1;
        }
      }
    }
    return { updated, created };
  }
}
