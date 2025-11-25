import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTeacherCommissionDto } from './dto/create-teacher-commission.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterTeacherCommissionDto,
  SortTeacherCommissionDto,
} from './dto/query-teacher-commission.dto';
import { TeacherCommissionRepository } from './infrastructure/persistence/teacher-commission.repository';
import {
  TeacherCommission,
  CommissionStatus,
} from './domain/teacher-commission';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateTeacherCommissionDto } from './dto/update-teacher-commission.dto';

@Injectable()
export class TeacherCommissionService {
  constructor(
    private readonly teacherCommissionRepository: TeacherCommissionRepository,
  ) {}

  async create(
    createCommissionDto: CreateTeacherCommissionDto,
  ): Promise<TeacherCommission> {
    // Transform DTO to domain format
    const commissionData: Partial<TeacherCommission> = {
      amount: createCommissionDto.amount,
      commissionPercentage: createCommissionDto.commissionPercentage,
      commissionAmount: createCommissionDto.commissionAmount,
      status: CommissionStatus.PENDING,
      dueDate: new Date(createCommissionDto.dueDate),
      description: createCommissionDto.description,
      teacher: createCommissionDto.teacher as any,
      class: createCommissionDto.class as any,
      student: createCommissionDto.student as any,
    };

    return this.teacherCommissionRepository.create(commissionData);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTeacherCommissionDto | null;
    sortOptions?: SortTeacherCommissionDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<TeacherCommission[]> {
    return this.teacherCommissionRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(
    id: TeacherCommission['id'],
  ): Promise<NullableType<TeacherCommission>> {
    return this.teacherCommissionRepository.findById(id);
  }

  async findByTeacher(teacherId: number): Promise<TeacherCommission[]> {
    return this.teacherCommissionRepository.findByTeacher(teacherId);
  }

  async findByClass(classId: number): Promise<TeacherCommission[]> {
    return this.teacherCommissionRepository.findByClass(classId);
  }

  async findByStudent(studentId: number): Promise<TeacherCommission[]> {
    return this.teacherCommissionRepository.findByStudent(studentId);
  }

  async findPendingCommissions(): Promise<TeacherCommission[]> {
    return this.teacherCommissionRepository.findPendingCommissions();
  }

  async findOverdueCommissions(): Promise<TeacherCommission[]> {
    return this.teacherCommissionRepository.findOverdueCommissions();
  }

  async update(
    id: TeacherCommission['id'],
    updateCommissionDto: UpdateTeacherCommissionDto,
  ): Promise<TeacherCommission | null> {
    // Transform DTO to domain format
    const commissionData: Partial<TeacherCommission> = {
      ...updateCommissionDto,
      dueDate: updateCommissionDto.dueDate
        ? new Date(updateCommissionDto.dueDate)
        : undefined,
      teacher: updateCommissionDto.teacher as any,
      class: updateCommissionDto.class as any,
      student: updateCommissionDto.student as any,
    };

    return this.teacherCommissionRepository.update(id, commissionData);
  }

  async markAsPaid(
    id: TeacherCommission['id'],
    transactionId?: string,
  ): Promise<TeacherCommission | null> {
    return this.teacherCommissionRepository.markAsPaid(id, transactionId);
  }

  async calculateCommission(
    teacherId: number,
    classId: number,
    studentId: number,
    amount: number,
    dueDate: Date,
    description?: string,
  ): Promise<TeacherCommission> {
    // Get teacher to get commission percentage
    // This would need to be injected from TeachersService
    // For now, we'll use a default percentage
    const commissionPercentage = 15.0; // This should come from teacher data
    const commissionAmount = (amount * commissionPercentage) / 100;

    const commissionData: Partial<TeacherCommission> = {
      amount,
      commissionPercentage,
      commissionAmount,
      status: CommissionStatus.PENDING,
      dueDate,
      description: description || `Commission for class enrollment`,
      teacher: { id: teacherId } as any,
      class: { id: classId } as any,
      student: { id: studentId } as any,
    };

    return this.teacherCommissionRepository.create(commissionData);
  }

  async remove(id: TeacherCommission['id']): Promise<void> {
    await this.teacherCommissionRepository.remove(id);
  }
}
