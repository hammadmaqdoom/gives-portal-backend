import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceEntity } from '../entities/performance.entity';
import { Performance } from '../../../../domain/performance';
import { PerformanceMapper } from '../mappers/performance.mapper';
import { PerformanceRepository } from '../../performance.repository';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterPerformanceDto,
  SortPerformanceDto,
} from '../../../../dto/query-performance.dto';

@Injectable()
export class PerformancesRelationalRepository implements PerformanceRepository {
  constructor(
    @InjectRepository(PerformanceEntity)
    private readonly performancesRepository: Repository<PerformanceEntity>,
    private readonly performanceMapper: PerformanceMapper,
  ) {}

  async create(data: Partial<Performance>): Promise<Performance> {
    const performanceEntity = this.performanceMapper.toPersistence(data);
    const newPerformance = await this.performancesRepository.save(
      this.performancesRepository.create(performanceEntity),
    );
    return this.performanceMapper.toDomain(newPerformance);
  }

  async findById(id: Performance['id']): Promise<NullableType<Performance>> {
    const performance = await this.performancesRepository.findOne({
      where: { id },
    });
    return performance ? this.performanceMapper.toDomain(performance) : null;
  }

  async findByStudentAndAssignment(
    studentId: number,
    assignmentId: number,
  ): Promise<NullableType<Performance>> {
    const performance = await this.performancesRepository.findOne({
      where: {
        student: { id: studentId },
        assignment: { id: assignmentId },
      },
    });
    return performance ? this.performanceMapper.toDomain(performance) : null;
  }

  async findByStudent(studentId: number): Promise<Performance[]> {
    const performances = await this.performancesRepository.find({
      where: { student: { id: studentId } },
    });
    return performances.map((performance) =>
      this.performanceMapper.toDomain(performance),
    );
  }

  async findByAssignment(assignmentId: number): Promise<Performance[]> {
    const performances = await this.performancesRepository.find({
      where: { assignment: { id: assignmentId } },
    });
    return performances.map((performance) =>
      this.performanceMapper.toDomain(performance),
    );
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
    const queryBuilder = this.performancesRepository
      .createQueryBuilder('performance')
      .leftJoinAndSelect('performance.student', 'student')
      .leftJoinAndSelect('performance.assignment', 'assignment');

    if (filterOptions?.studentName) {
      queryBuilder.andWhere('student.name ILIKE :studentName', {
        studentName: `%${filterOptions.studentName}%`,
      });
    }

    if (filterOptions?.assignmentTitle) {
      queryBuilder.andWhere('assignment.title ILIKE :assignmentTitle', {
        assignmentTitle: `%${filterOptions.assignmentTitle}%`,
      });
    }

    if (filterOptions?.scoreMin !== undefined) {
      queryBuilder.andWhere('performance.score >= :scoreMin', {
        scoreMin: filterOptions.scoreMin,
      });
    }

    if (filterOptions?.scoreMax !== undefined) {
      queryBuilder.andWhere('performance.score <= :scoreMax', {
        scoreMax: filterOptions.scoreMax,
      });
    }

    if (filterOptions?.grade) {
      queryBuilder.andWhere('performance.grade = :grade', {
        grade: filterOptions.grade,
      });
    }

    if (filterOptions?.submittedFrom) {
      queryBuilder.andWhere('performance.submittedAt >= :submittedFrom', {
        submittedFrom: filterOptions.submittedFrom,
      });
    }

    if (filterOptions?.submittedTo) {
      queryBuilder.andWhere('performance.submittedAt <= :submittedTo', {
        submittedTo: filterOptions.submittedTo,
      });
    }

    if (sortOptions?.length) {
      sortOptions.forEach((sortOption) => {
        queryBuilder.addOrderBy(
          `performance.${sortOption.orderBy}`,
          sortOption.order.toUpperCase() as 'ASC' | 'DESC',
        );
      });
    } else {
      queryBuilder.addOrderBy('performance.createdAt', 'DESC');
      queryBuilder.addOrderBy('performance.id', 'ASC');
    }

    queryBuilder.skip((paginationOptions.page - 1) * paginationOptions.limit);
    queryBuilder.take(paginationOptions.limit);

    const performances = await queryBuilder.getMany();
    return performances.map((performance) =>
      this.performanceMapper.toDomain(performance),
    );
  }

  async update(
    id: Performance['id'],
    data: Partial<Performance>,
  ): Promise<Performance | null> {
    const performance = await this.performancesRepository.findOne({
      where: { id },
    });

    if (!performance) {
      return null;
    }

    const performanceEntity = this.performanceMapper.toPersistence(data);
    const updatedPerformance = await this.performancesRepository.save({
      ...performance,
      ...performanceEntity,
    });

    return this.performanceMapper.toDomain(updatedPerformance);
  }

  async remove(id: Performance['id']): Promise<void> {
    await this.performancesRepository.softDelete(id);
  }
}
