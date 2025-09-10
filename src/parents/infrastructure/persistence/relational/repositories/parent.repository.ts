import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentEntity } from '../entities/parent.entity';
import { Parent } from '../../../../domain/parent';
import { ParentMapper } from '../mappers/parent.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import {
  FilterParentDto,
  SortParentDto,
} from '../../../../dto/query-parent.dto';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class ParentsRelationalRepository {
  constructor(
    @InjectRepository(ParentEntity)
    private readonly parentsRepository: Repository<ParentEntity>,
    private readonly parentMapper: ParentMapper,
  ) {}

  async create(data: Partial<Parent>): Promise<Parent> {
    const parentEntity = this.parentMapper.toPersistence(data);
    const newParent = await this.parentsRepository.save(
      this.parentsRepository.create(parentEntity),
    );

    return this.parentMapper.toDomain(newParent);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterParentDto | null;
    sortOptions?: SortParentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Parent[]> {
    const queryBuilder = this.parentsRepository.createQueryBuilder('parent');

    queryBuilder
      .leftJoinAndSelect('parent.user', 'user')
      .leftJoinAndSelect('parent.parentStudents', 'parentStudents')
      .leftJoinAndSelect('parentStudents.student', 'student');

    if (filterOptions?.search) {
      queryBuilder.andWhere(
        '(parent.fullName ILIKE :search OR parent.email ILIKE :search OR parent.mobile ILIKE :search)',
        { search: `%${filterOptions.search}%` },
      );
    }

    if (filterOptions?.city) {
      queryBuilder.andWhere('parent.city = :city', {
        city: filterOptions.city,
      });
    }

    if (filterOptions?.country) {
      queryBuilder.andWhere('parent.country = :country', {
        country: filterOptions.country,
      });
    }

    if (filterOptions?.relationship) {
      queryBuilder.andWhere('parent.relationship = :relationship', {
        relationship: filterOptions.relationship,
      });
    }

    if (sortOptions && sortOptions.length > 0) {
      sortOptions.forEach((sort) => {
        if (sort.key && sort.order) {
          queryBuilder.addOrderBy(`parent.${sort.key}`, sort.order);
        }
      });
    } else {
      queryBuilder.addOrderBy('parent.createdAt', 'DESC');
    }

    const { page, limit } = paginationOptions;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const parents = await queryBuilder.getMany();

    return parents.map((parent) => this.parentMapper.toDomain(parent));
  }

  async findById(id: Parent['id']): Promise<NullableType<Parent>> {
    const parent = await this.parentsRepository.findOne({
      where: { id },
      relations: ['user', 'parentStudents', 'parentStudents.student'],
    });

    return parent ? this.parentMapper.toDomain(parent) : null;
  }

  async findByEmail(email: Parent['email']): Promise<NullableType<Parent>> {
    if (!email) return null;

    const parent = await this.parentsRepository.findOne({
      where: { email },
      relations: ['user', 'parentStudents', 'parentStudents.student'],
    });

    return parent ? this.parentMapper.toDomain(parent) : null;
  }

  async findByMobile(mobile: Parent['mobile']): Promise<NullableType<Parent>> {
    if (!mobile) return null;

    const parent = await this.parentsRepository.findOne({
      where: { mobile },
      relations: ['user', 'parentStudents', 'parentStudents.student'],
    });

    return parent ? this.parentMapper.toDomain(parent) : null;
  }

  async findByUserId(userId: number): Promise<NullableType<Parent>> {
    if (!userId) return null;

    const parent = await this.parentsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'parentStudents', 'parentStudents.student'],
    });

    return parent ? this.parentMapper.toDomain(parent) : null;
  }

  async update(
    id: Parent['id'],
    data: Partial<Parent>,
  ): Promise<Parent | null> {
    const parent = await this.parentsRepository.findOne({
      where: { id },
    });

    if (!parent) {
      return null;
    }

    const parentEntity = this.parentMapper.toPersistence(data);
    const updatedParent = await this.parentsRepository.save({
      ...parent,
      ...parentEntity,
    });

    return this.parentMapper.toDomain(updatedParent);
  }

  async remove(id: Parent['id']): Promise<void> {
    await this.parentsRepository.softDelete(id);
  }
}
