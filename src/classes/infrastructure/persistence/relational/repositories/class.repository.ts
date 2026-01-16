import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from '../entities/class.entity';
import { Class } from '../../../../domain/class';
import { ClassMapper } from '../mappers/class.mapper';
import { ClassRepository } from '../../class.repository';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { FilterClassDto, SortClassDto } from '../../../../dto/query-class.dto';
import { ClassScheduleRepository } from './class-schedule.repository';

@Injectable()
export class ClassesRelationalRepository implements ClassRepository {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly classesRepository: Repository<ClassEntity>,
    private readonly classMapper: ClassMapper,
    private readonly classScheduleRepository: ClassScheduleRepository,
  ) {}

  async create(data: Partial<Class>): Promise<Class> {
    const classEntity = this.classMapper.toPersistence(data);
    const newClass = await this.classesRepository.save(
      this.classesRepository.create(classEntity),
    );

    // Handle schedules if provided
    if (data.schedules && data.schedules.length > 0) {
      await this.classScheduleRepository.createMany(
        data.schedules as any,
        newClass.id,
      );
    }

    // Fetch the complete class with schedules
    const completeClass = await this.classesRepository.findOne({
      where: { id: newClass.id },
      relations: ['subject', 'teacher', 'schedules', 'thumbnailFile', 'coverImageFile'],
    });

    return this.classMapper.toDomain(completeClass!);
  }

  async findById(id: Class['id']): Promise<NullableType<Class>> {
    const classObj = await this.classesRepository.findOne({
      where: { id },
      relations: ['subject', 'teacher', 'schedules', 'thumbnailFile', 'coverImageFile'],
    });
    return classObj ? this.classMapper.toDomain(classObj) : null;
  }

  async findByName(name: Class['name']): Promise<NullableType<Class>> {
    const classObj = await this.classesRepository.findOne({
      where: { name },
    });
    return classObj ? this.classMapper.toDomain(classObj) : null;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterClassDto | null;
    sortOptions?: SortClassDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Class[]> {
    const queryBuilder = this.classesRepository
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.subject', 'subject')
      .leftJoinAndSelect('class.teacher', 'teacher')
      .leftJoinAndSelect('class.schedules', 'schedules')
      .leftJoinAndSelect('class.thumbnailFile', 'thumbnailFile')
      .leftJoinAndSelect('class.coverImageFile', 'coverImageFile');

    if (filterOptions?.name) {
      queryBuilder.andWhere('class.name ILIKE :name', {
        name: `%${filterOptions.name}%`,
      });
    }

    if (filterOptions?.batchTerm) {
      queryBuilder.andWhere('class.batchTerm ILIKE :batchTerm', {
        batchTerm: `%${filterOptions.batchTerm}%`,
      });
    }

    if (filterOptions?.timing) {
      queryBuilder.andWhere('class.timing ILIKE :timing', {
        timing: `%${filterOptions.timing}%`,
      });
    }

    if (filterOptions?.teacherId) {
      queryBuilder.andWhere('class.teacherId = :teacherId', {
        teacherId: filterOptions.teacherId,
      });
    }

    // Support isPublicForSale filter
    if ((filterOptions as any)?.isPublicForSale !== undefined) {
      queryBuilder.andWhere('class.isPublicForSale = :isPublicForSale', {
        isPublicForSale: (filterOptions as any).isPublicForSale,
      });
    }

    if (sortOptions?.length) {
      sortOptions.forEach((sortOption) => {
        queryBuilder.addOrderBy(
          `class.${sortOption.orderBy}`,
          sortOption.order.toUpperCase() as 'ASC' | 'DESC',
        );
      });
    } else {
      queryBuilder.addOrderBy('class.id', 'ASC');
    }

    queryBuilder.skip((paginationOptions.page - 1) * paginationOptions.limit);
    queryBuilder.take(paginationOptions.limit);

    const classes = await queryBuilder.getMany();
    return classes.map((classObj) => this.classMapper.toDomain(classObj));
  }

  async update(id: Class['id'], data: Partial<Class>): Promise<Class | null> {
    const classObj = await this.classesRepository.findOne({
      where: { id },
      relations: ['subject', 'teacher', 'schedules', 'thumbnailFile', 'coverImageFile'],
    });

    if (!classObj) {
      return null;
    }

    const classEntity = this.classMapper.toPersistence(data);
    const updatedClass = await this.classesRepository.save({
      ...classObj,
      ...classEntity,
    });

    // Handle schedules if provided
    if (data.schedules !== undefined) {
      if (data.schedules.length > 0) {
        await this.classScheduleRepository.updateMany(
          id,
          data.schedules as any,
        );
      } else {
        await this.classScheduleRepository.deleteByClassId(id);
      }
    }

    // Fetch the complete updated class with schedules
    const completeClass = await this.classesRepository.findOne({
      where: { id },
      relations: ['subject', 'teacher', 'schedules', 'thumbnailFile', 'coverImageFile'],
    });

    return this.classMapper.toDomain(completeClass!);
  }

  async remove(id: Class['id']): Promise<void> {
    await this.classesRepository.softDelete(id);
  }
}
