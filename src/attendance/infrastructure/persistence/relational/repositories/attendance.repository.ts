import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEntity } from '../entities/attendance.entity';
import { Attendance } from '../../../../domain/attendance';
import { AttendanceMapper } from '../mappers/attendance.mapper';
import { AttendanceRepository } from '../../attendance.repository';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterAttendanceDto,
  SortAttendanceDto,
} from '../../../../dto/query-attendance.dto';

@Injectable()
export class AttendancesRelationalRepository implements AttendanceRepository {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendancesRepository: Repository<AttendanceEntity>,
    private readonly attendanceMapper: AttendanceMapper,
  ) {}

  async create(data: Partial<Attendance>): Promise<Attendance> {
    const attendanceEntity = this.attendanceMapper.toPersistence(data);
    const newAttendance = await this.attendancesRepository.save(
      this.attendancesRepository.create(attendanceEntity),
    );
    return this.attendanceMapper.toDomain(newAttendance);
  }

  async findById(id: Attendance['id']): Promise<NullableType<Attendance>> {
    const attendance = await this.attendancesRepository.findOne({
      where: { id },
    });
    return attendance ? this.attendanceMapper.toDomain(attendance) : null;
  }

  async findByStudentAndDate(
    studentId: number,
    date: Date,
  ): Promise<NullableType<Attendance>> {
    const attendance = await this.attendancesRepository.findOne({
      where: {
        student: { id: studentId },
        date: date,
      },
    });
    return attendance ? this.attendanceMapper.toDomain(attendance) : null;
  }

  async findByClassAndDate(classId: number, date: Date): Promise<Attendance[]> {
    const attendances = await this.attendancesRepository.find({
      where: {
        class: { id: classId },
        date: date,
      },
    });
    return attendances.map((attendance) =>
      this.attendanceMapper.toDomain(attendance),
    );
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
    const queryBuilder = this.attendancesRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .leftJoinAndSelect('attendance.class', 'class');

    if (filterOptions?.studentName) {
      queryBuilder.andWhere('student.name ILIKE :studentName', {
        studentName: `%${filterOptions.studentName}%`,
      });
    }

    if (filterOptions?.className) {
      queryBuilder.andWhere('class.name ILIKE :className', {
        className: `%${filterOptions.className}%`,
      });
    }

    if (filterOptions?.status) {
      queryBuilder.andWhere('attendance.status = :status', {
        status: filterOptions.status,
      });
    }

    if (filterOptions?.dateFrom) {
      queryBuilder.andWhere('attendance.date >= :dateFrom', {
        dateFrom: filterOptions.dateFrom,
      });
    }

    if (filterOptions?.dateTo) {
      queryBuilder.andWhere('attendance.date <= :dateTo', {
        dateTo: filterOptions.dateTo,
      });
    }

    if (sortOptions?.length) {
      sortOptions.forEach((sortOption) => {
        queryBuilder.addOrderBy(
          `attendance.${sortOption.orderBy}`,
          sortOption.order.toUpperCase() as 'ASC' | 'DESC',
        );
      });
    } else {
      queryBuilder.addOrderBy('attendance.date', 'DESC');
      queryBuilder.addOrderBy('attendance.id', 'ASC');
    }

    queryBuilder.skip((paginationOptions.page - 1) * paginationOptions.limit);
    queryBuilder.take(paginationOptions.limit);

    const attendances = await queryBuilder.getMany();
    return attendances.map((attendance) =>
      this.attendanceMapper.toDomain(attendance),
    );
  }

  async update(
    id: Attendance['id'],
    data: Partial<Attendance>,
  ): Promise<Attendance | null> {
    const attendance = await this.attendancesRepository.findOne({
      where: { id },
    });

    if (!attendance) {
      return null;
    }

    const attendanceEntity = this.attendanceMapper.toPersistence(data);
    const updatedAttendance = await this.attendancesRepository.save({
      ...attendance,
      ...attendanceEntity,
    });

    return this.attendanceMapper.toDomain(updatedAttendance);
  }

  async remove(id: Attendance['id']): Promise<void> {
    await this.attendancesRepository.softDelete(id);
  }
}
