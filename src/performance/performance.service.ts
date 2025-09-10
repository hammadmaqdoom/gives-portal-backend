import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterPerformanceDto,
  SortPerformanceDto,
} from './dto/query-performance.dto';
import { PerformanceRepository } from './infrastructure/persistence/performance.repository';
import { Performance } from './domain/performance';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdatePerformanceDto } from './dto/update-performance.dto';

@Injectable()
export class PerformanceService {
  constructor(private readonly performanceRepository: PerformanceRepository) {}

  async create(
    createPerformanceDto: CreatePerformanceDto,
  ): Promise<Performance> {
    // Check if performance already exists for this student and assignment
    const existingPerformance =
      await this.performanceRepository.findByStudentAndAssignment(
        createPerformanceDto.student.id,
        createPerformanceDto.assignment.id,
      );

    if (existingPerformance) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          performance: 'performanceAlreadyExistsForStudentAndAssignment',
        },
      });
    }

    // Transform DTO to domain format
    const performanceData: Partial<Performance> = {
      score: createPerformanceDto.score,
      comments: createPerformanceDto.comments,
      grade: createPerformanceDto.grade,
      submittedAt: createPerformanceDto.submittedAt,
      gradedAt: createPerformanceDto.gradedAt,
      student: createPerformanceDto.student as any,
      assignment: createPerformanceDto.assignment as any,
    };

    return this.performanceRepository.create(performanceData);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterPerformanceDto | null;
    sortOptions?: SortPerformanceDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Performance[]> {
    return this.performanceRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Performance['id']): Promise<NullableType<Performance>> {
    return this.performanceRepository.findById(id);
  }

  async findByStudentAndAssignment(
    studentId: number,
    assignmentId: number,
  ): Promise<NullableType<Performance>> {
    return this.performanceRepository.findByStudentAndAssignment(
      studentId,
      assignmentId,
    );
  }

  async findByStudent(studentId: number): Promise<Performance[]> {
    return this.performanceRepository.findByStudent(studentId);
  }

  async findByAssignment(assignmentId: number): Promise<Performance[]> {
    return this.performanceRepository.findByAssignment(assignmentId);
  }

  async update(
    id: Performance['id'],
    updatePerformanceDto: UpdatePerformanceDto,
  ): Promise<Performance | null> {
    // Transform DTO to domain format
    const performanceData: Partial<Performance> = {
      ...updatePerformanceDto,
      student: updatePerformanceDto.student as any,
      assignment: updatePerformanceDto.assignment as any,
    };

    return this.performanceRepository.update(id, performanceData);
  }

  async remove(id: Performance['id']): Promise<void> {
    await this.performanceRepository.remove(id);
  }
}
