import { Attendance } from '../../domain/attendance';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import {
  FilterAttendanceDto,
  SortAttendanceDto,
} from '../../dto/query-attendance.dto';

export abstract class AttendanceRepository {
  abstract create(data: Partial<Attendance>): Promise<Attendance>;

  abstract findById(id: Attendance['id']): Promise<NullableType<Attendance>>;

  abstract findByStudentAndDate(
    studentId: number,
    date: Date,
  ): Promise<NullableType<Attendance>>;

  abstract findByClassAndDate(
    classId: number,
    date: Date,
  ): Promise<Attendance[]>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterAttendanceDto | null;
    sortOptions?: SortAttendanceDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Attendance[]>;

  abstract update(
    id: Attendance['id'],
    data: Partial<Attendance>,
  ): Promise<Attendance | null>;

  abstract remove(id: Attendance['id']): Promise<void>;
}
