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

  /**
   * Create or update a Performance record from graded submission data.
   * Used when a teacher grades a submission so Performance page and Grade Management show data.
   */
  async createOrUpdateFromSubmissionPayload(payload: {
    studentId: number;
    assignmentId: number;
    classId?: number | null;
    score: number;
    grade: string;
    comments?: string | null;
    gradedAt: Date;
    submittedAt?: Date | null;
  }): Promise<Performance | null> {
    const existing = await this.performanceRepository.findByStudentAndAssignment(
      payload.studentId,
      payload.assignmentId,
    );
    const gradedAt = payload.gradedAt ?? new Date();
    const submittedAt = payload.submittedAt ?? gradedAt;

    if (existing) {
      return this.performanceRepository.update(existing.id, {
        score: payload.score,
        grade: payload.grade,
        comments: payload.comments ?? undefined,
        gradedAt,
        student: { id: payload.studentId } as any,
        assignment: { id: payload.assignmentId } as any,
      });
    }

    const performanceData: Partial<Performance> & { class?: { id: number } } = {
      score: payload.score,
      grade: payload.grade,
      comments: payload.comments ?? undefined,
      submittedAt,
      gradedAt,
      student: { id: payload.studentId } as any,
      assignment: { id: payload.assignmentId } as any,
    };
    if (payload.classId != null) {
      performanceData.class = { id: payload.classId };
    }
    return this.performanceRepository.create(performanceData);
  }
}
