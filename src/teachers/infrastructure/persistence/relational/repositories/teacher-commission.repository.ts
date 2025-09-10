import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherCommissionEntity } from '../entities/teacher-commission.entity';
import { TeacherCommission } from '../../../../domain/teacher-commission';
import { TeacherCommissionMapper } from '../mappers/teacher-commission.mapper';
import { TeacherCommissionRepository } from '../../teacher-commission.repository';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterTeacherCommissionDto,
  SortTeacherCommissionDto,
} from '../../../../dto/query-teacher-commission.dto';

@Injectable()
export class TeacherCommissionsRelationalRepository
  implements TeacherCommissionRepository
{
  constructor(
    @InjectRepository(TeacherCommissionEntity)
    private readonly teacherCommissionRepository: Repository<TeacherCommissionEntity>,
    private readonly teacherCommissionMapper: TeacherCommissionMapper,
  ) {}

  async create(data: Partial<TeacherCommission>): Promise<TeacherCommission> {
    const commissionEntity = this.teacherCommissionMapper.toPersistence(data);
    const newCommission = await this.teacherCommissionRepository.save(
      this.teacherCommissionRepository.create(commissionEntity),
    );

    return this.teacherCommissionMapper.toDomain(newCommission);
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
    const queryBuilder = this.teacherCommissionRepository
      .createQueryBuilder('commission')
      .leftJoinAndSelect('commission.teacher', 'teacher')
      .leftJoinAndSelect('commission.class', 'class')
      .leftJoinAndSelect('commission.student', 'student');

    if (filterOptions?.teacherId) {
      queryBuilder.andWhere('commission.teacherId = :teacherId', {
        teacherId: filterOptions.teacherId,
      });
    }

    if (filterOptions?.classId) {
      queryBuilder.andWhere('commission.classId = :classId', {
        classId: filterOptions.classId,
      });
    }

    if (filterOptions?.studentId) {
      queryBuilder.andWhere('commission.studentId = :studentId', {
        studentId: filterOptions.studentId,
      });
    }

    if (filterOptions?.status) {
      queryBuilder.andWhere('commission.status = :status', {
        status: filterOptions.status,
      });
    }

    if (filterOptions?.description) {
      queryBuilder.andWhere('commission.description ILIKE :description', {
        description: `%${filterOptions.description}%`,
      });
    }

    if (sortOptions) {
      sortOptions.forEach((sort) => {
        queryBuilder.addOrderBy(
          `commission.${sort.orderBy}`,
          sort.order?.toUpperCase() as 'ASC' | 'DESC',
        );
      });
    }

    queryBuilder
      .skip(paginationOptions.page * paginationOptions.limit)
      .take(paginationOptions.limit);

    const commissions = await queryBuilder.getMany();

    return commissions.map((commission) =>
      this.teacherCommissionMapper.toDomain(commission),
    );
  }

  async findById(
    id: TeacherCommission['id'],
  ): Promise<NullableType<TeacherCommission>> {
    const commission = await this.teacherCommissionRepository.findOne({
      where: { id },
      relations: ['teacher', 'class', 'student'],
    });

    return commission
      ? this.teacherCommissionMapper.toDomain(commission)
      : null;
  }

  async findByTeacher(teacherId: number): Promise<TeacherCommission[]> {
    const commissions = await this.teacherCommissionRepository.find({
      where: { teacher: { id: teacherId } },
      relations: ['teacher', 'class', 'student'],
    });

    return commissions.map((commission) =>
      this.teacherCommissionMapper.toDomain(commission),
    );
  }

  async findByClass(classId: number): Promise<TeacherCommission[]> {
    const commissions = await this.teacherCommissionRepository.find({
      where: { class: { id: classId } },
      relations: ['teacher', 'class', 'student'],
    });

    return commissions.map((commission) =>
      this.teacherCommissionMapper.toDomain(commission),
    );
  }

  async findByStudent(studentId: number): Promise<TeacherCommission[]> {
    const commissions = await this.teacherCommissionRepository.find({
      where: { student: { id: studentId } },
      relations: ['teacher', 'class', 'student'],
    });

    return commissions.map((commission) =>
      this.teacherCommissionMapper.toDomain(commission),
    );
  }

  async findPendingCommissions(): Promise<TeacherCommission[]> {
    const commissions = await this.teacherCommissionRepository.find({
      where: { status: 'pending' },
      relations: ['teacher', 'class', 'student'],
    });

    return commissions.map((commission) =>
      this.teacherCommissionMapper.toDomain(commission),
    );
  }

  async findOverdueCommissions(): Promise<TeacherCommission[]> {
    const commissions = await this.teacherCommissionRepository.find({
      where: {
        status: 'pending',
        dueDate: { $lt: new Date() } as any,
      },
      relations: ['teacher', 'class', 'student'],
    });

    return commissions.map((commission) =>
      this.teacherCommissionMapper.toDomain(commission),
    );
  }

  async update(
    id: TeacherCommission['id'],
    data: Partial<TeacherCommission>,
  ): Promise<TeacherCommission | null> {
    const commission = await this.teacherCommissionRepository.findOne({
      where: { id },
      relations: ['teacher', 'class', 'student'],
    });

    if (!commission) {
      return null;
    }

    const commissionEntity = this.teacherCommissionMapper.toPersistence(data);
    const updatedCommission = await this.teacherCommissionRepository.save({
      ...commission,
      ...commissionEntity,
    });

    return this.teacherCommissionMapper.toDomain(updatedCommission);
  }

  async markAsPaid(
    id: TeacherCommission['id'],
    transactionId?: string,
  ): Promise<TeacherCommission | null> {
    const commission = await this.teacherCommissionRepository.findOne({
      where: { id },
      relations: ['teacher', 'class', 'student'],
    });

    if (!commission) {
      return null;
    }

    const updatedCommission = await this.teacherCommissionRepository.save({
      ...commission,
      status: 'paid',
      paidAt: new Date(),
      transactionId,
    });

    return this.teacherCommissionMapper.toDomain(updatedCommission);
  }

  async remove(id: TeacherCommission['id']): Promise<void> {
    await this.teacherCommissionRepository.softDelete(id);
  }
}
