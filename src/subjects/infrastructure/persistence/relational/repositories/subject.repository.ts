import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubjectEntity } from '../entities/subject.entity';
import { Subject } from '../../../../domain/subject';
import { SubjectMapper } from '../mappers/subject.mapper';
import { SubjectRepository } from '../../subject.repository';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import {
  FilterSubjectDto,
  SortSubjectDto,
} from '../../../../dto/query-subject.dto';

@Injectable()
export class SubjectsRelationalRepository implements SubjectRepository {
  constructor(
    @InjectRepository(SubjectEntity)
    private readonly subjectsRepository: Repository<SubjectEntity>,
    private readonly subjectMapper: SubjectMapper,
  ) {}

  async create(data: Partial<Subject>): Promise<Subject> {
    const subjectEntity = this.subjectMapper.toPersistence(data);
    const newSubject = await this.subjectsRepository.save(
      this.subjectsRepository.create(subjectEntity),
    );
    return this.subjectMapper.toDomain(newSubject);
  }

  async findById(id: Subject['id']): Promise<NullableType<Subject>> {
    const subject = await this.subjectsRepository.findOne({
      where: { id },
    });
    return subject ? this.subjectMapper.toDomain(subject) : null;
  }

  async findByName(name: Subject['name']): Promise<NullableType<Subject>> {
    const subject = await this.subjectsRepository.findOne({
      where: { name },
    });
    return subject ? this.subjectMapper.toDomain(subject) : null;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterSubjectDto | null;
    sortOptions?: SortSubjectDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Subject[]> {
    const queryBuilder = this.subjectsRepository.createQueryBuilder('subject');

    if (filterOptions?.name) {
      queryBuilder.andWhere('subject.name ILIKE :name', {
        name: `%${filterOptions.name}%`,
      });
    }

    if (filterOptions?.description) {
      queryBuilder.andWhere('subject.description ILIKE :description', {
        description: `%${filterOptions.description}%`,
      });
    }

    if (sortOptions?.length) {
      sortOptions.forEach((sortOption) => {
        queryBuilder.addOrderBy(
          `subject.${sortOption.orderBy}`,
          sortOption.order.toUpperCase() as 'ASC' | 'DESC',
        );
      });
    } else {
      queryBuilder.addOrderBy('subject.id', 'ASC');
    }

    queryBuilder.skip((paginationOptions.page - 1) * paginationOptions.limit);
    queryBuilder.take(paginationOptions.limit);

    const subjects = await queryBuilder.getMany();
    return subjects.map((subject) => this.subjectMapper.toDomain(subject));
  }

  async update(
    id: Subject['id'],
    data: Partial<Subject>,
  ): Promise<Subject | null> {
    const subject = await this.subjectsRepository.findOne({
      where: { id },
    });

    if (!subject) {
      return null;
    }

    const subjectEntity = this.subjectMapper.toPersistence(data);
    const updatedSubject = await this.subjectsRepository.save({
      ...subject,
      ...subjectEntity,
    });

    return this.subjectMapper.toDomain(updatedSubject);
  }

  async remove(id: Subject['id']): Promise<void> {
    await this.subjectsRepository.softDelete(id);
  }
}
