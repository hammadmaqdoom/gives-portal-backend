import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentEntity } from '../entities/assignment.entity';
import { Assignment } from '../../../../domain/assignment';
import { AssignmentMapper } from '../mappers/assignment.mapper';
import { AssignmentRepository } from '../../assignment.repository';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterAssignmentDto,
  SortAssignmentDto,
} from '../../../../dto/query-assignment.dto';

@Injectable()
export class AssignmentsRelationalRepository implements AssignmentRepository {
  constructor(
    @InjectRepository(AssignmentEntity)
    private readonly assignmentsRepository: Repository<AssignmentEntity>,
    private readonly assignmentMapper: AssignmentMapper,
  ) {}

  async create(data: Partial<Assignment>): Promise<Assignment> {
    const assignmentEntity = this.assignmentMapper.toPersistence(data);
    const newAssignment = await this.assignmentsRepository.save(
      this.assignmentsRepository.create(assignmentEntity),
    );
    return this.assignmentMapper.toDomain(newAssignment);
  }

  async findById(id: Assignment['id']): Promise<NullableType<Assignment>> {
    const assignment = await this.assignmentsRepository.findOne({
      where: { id },
    });
    return assignment ? this.assignmentMapper.toDomain(assignment) : null;
  }

  async findByClass(classId: number): Promise<Assignment[]> {
    const assignments = await this.assignmentsRepository.find({
      where: { class: { id: classId } },
    });
    return assignments.map((assignment) =>
      this.assignmentMapper.toDomain(assignment),
    );
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterAssignmentDto | null;
    sortOptions?: SortAssignmentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Assignment[]> {
    const queryBuilder = this.assignmentsRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.class', 'class');

    if (filterOptions?.title) {
      queryBuilder.andWhere('assignment.title ILIKE :title', {
        title: `%${filterOptions.title}%`,
      });
    }

    if (filterOptions?.className) {
      queryBuilder.andWhere('class.name ILIKE :className', {
        className: `%${filterOptions.className}%`,
      });
    }

    if (filterOptions?.type) {
      queryBuilder.andWhere('assignment.type = :type', {
        type: filterOptions.type,
      });
    }

    if (filterOptions?.dueDateFrom) {
      queryBuilder.andWhere('assignment.dueDate >= :dueDateFrom', {
        dueDateFrom: filterOptions.dueDateFrom,
      });
    }

    if (filterOptions?.dueDateTo) {
      queryBuilder.andWhere('assignment.dueDate <= :dueDateTo', {
        dueDateTo: filterOptions.dueDateTo,
      });
    }

    if (sortOptions?.length) {
      sortOptions.forEach((sortOption) => {
        queryBuilder.addOrderBy(
          `assignment.${sortOption.orderBy}`,
          sortOption.order.toUpperCase() as 'ASC' | 'DESC',
        );
      });
    } else {
      queryBuilder.addOrderBy('assignment.dueDate', 'ASC');
      queryBuilder.addOrderBy('assignment.id', 'ASC');
    }

    queryBuilder.skip((paginationOptions.page - 1) * paginationOptions.limit);
    queryBuilder.take(paginationOptions.limit);

    const assignments = await queryBuilder.getMany();
    return assignments.map((assignment) =>
      this.assignmentMapper.toDomain(assignment),
    );
  }

  async update(
    id: Assignment['id'],
    data: Partial<Assignment>,
  ): Promise<Assignment | null> {
    const assignment = await this.assignmentsRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      return null;
    }

    const assignmentEntity = this.assignmentMapper.toPersistence(data);
    const updatedAssignment = await this.assignmentsRepository.save({
      ...assignment,
      ...assignmentEntity,
    });

    return this.assignmentMapper.toDomain(updatedAssignment);
  }

  async remove(id: Assignment['id']): Promise<void> {
    await this.assignmentsRepository.softDelete(id);
  }
}
