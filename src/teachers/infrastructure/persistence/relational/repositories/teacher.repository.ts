import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherEntity } from '../entities/teacher.entity';
import { Teacher } from '../../../../domain/teacher';
import { TeacherMapper } from '../mappers/teacher.mapper';
import { TeacherRepository } from '../../teacher.repository';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterTeacherDto,
  SortTeacherDto,
} from '../../../../dto/query-teacher.dto';

@Injectable()
export class TeachersRelationalRepository implements TeacherRepository {
  constructor(
    @InjectRepository(TeacherEntity)
    private readonly teachersRepository: Repository<TeacherEntity>,
    private readonly teacherMapper: TeacherMapper,
  ) {}

  async create(data: Partial<Teacher>): Promise<Teacher> {
    const teacherEntity = this.teacherMapper.toPersistence(data);
    const newTeacher = await this.teachersRepository.save(
      this.teachersRepository.create(teacherEntity),
    );
    return this.teacherMapper.toDomain(newTeacher);
  }

  async findById(id: Teacher['id']): Promise<NullableType<Teacher>> {
    const teacher = await this.teachersRepository.findOne({
      where: { id },
    });
    return teacher ? this.teacherMapper.toDomain(teacher) : null;
  }

  async findByEmail(email: Teacher['email']): Promise<NullableType<Teacher>> {
    if (!email) return null;
    const teacher = await this.teachersRepository.findOne({
      where: { email },
    });
    return teacher ? this.teacherMapper.toDomain(teacher) : null;
  }

  async findByPhone(phone: Teacher['phone']): Promise<NullableType<Teacher>> {
    if (!phone) return null;
    const teacher = await this.teachersRepository.findOne({
      where: { phone },
    });
    return teacher ? this.teacherMapper.toDomain(teacher) : null;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTeacherDto | null;
    sortOptions?: SortTeacherDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Teacher[]> {
    const queryBuilder = this.teachersRepository.createQueryBuilder('teacher');

    if (filterOptions?.name) {
      queryBuilder.andWhere('teacher.name ILIKE :name', {
        name: `%${filterOptions.name}%`,
      });
    }

    if (filterOptions?.email) {
      queryBuilder.andWhere('teacher.email ILIKE :email', {
        email: `%${filterOptions.email}%`,
      });
    }

    if (filterOptions?.phone) {
      queryBuilder.andWhere('teacher.phone ILIKE :phone', {
        phone: `%${filterOptions.phone}%`,
      });
    }

    if (sortOptions?.length) {
      sortOptions.forEach((sortOption) => {
        queryBuilder.addOrderBy(
          `teacher.${sortOption.orderBy}`,
          sortOption.order.toUpperCase() as 'ASC' | 'DESC',
        );
      });
    } else {
      queryBuilder.addOrderBy('teacher.id', 'ASC');
    }

    queryBuilder.skip((paginationOptions.page - 1) * paginationOptions.limit);
    queryBuilder.take(paginationOptions.limit);

    const teachers = await queryBuilder.getMany();
    return teachers.map((teacher) => this.teacherMapper.toDomain(teacher));
  }

  async update(
    id: Teacher['id'],
    data: Partial<Teacher>,
  ): Promise<Teacher | null> {
    const teacher = await this.teachersRepository.findOne({
      where: { id },
    });

    if (!teacher) {
      return null;
    }

    const teacherEntity = this.teacherMapper.toPersistence(data);
    const updatedTeacher = await this.teachersRepository.save({
      ...teacher,
      ...teacherEntity,
    });

    return this.teacherMapper.toDomain(updatedTeacher);
  }

  async remove(id: Teacher['id']): Promise<void> {
    await this.teachersRepository.softDelete(id);
  }
}
