import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterSubjectDto, SortSubjectDto } from './dto/query-subject.dto';
import { SubjectRepository } from './infrastructure/persistence/subject.repository';
import { Subject } from './domain/subject';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly subjectsRepository: SubjectRepository) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    const existingSubject = await this.subjectsRepository.findByName(
      createSubjectDto.name,
    );
    if (existingSubject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          name: 'subjectNameAlreadyExists',
        },
      });
    }

    try {
      return await this.subjectsRepository.create(createSubjectDto);
    } catch (error) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          name: 'subjectCreationFailed',
        },
      });
    }
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
    return this.subjectsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Subject['id']): Promise<NullableType<Subject>> {
    return this.subjectsRepository.findById(id);
  }

  async findByName(name: Subject['name']): Promise<NullableType<Subject>> {
    return this.subjectsRepository.findByName(name);
  }

  async update(
    id: Subject['id'],
    updateSubjectDto: UpdateSubjectDto,
  ): Promise<Subject | null> {
    if (updateSubjectDto.name) {
      const existingSubject = await this.subjectsRepository.findByName(
        updateSubjectDto.name,
      );
      if (existingSubject && existingSubject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            name: 'subjectNameAlreadyExists',
          },
        });
      }
    }

    try {
      return await this.subjectsRepository.update(id, updateSubjectDto);
    } catch (error) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          name: 'subjectUpdateFailed',
        },
      });
    }
  }

  async remove(id: Subject['id']): Promise<void> {
    try {
      await this.subjectsRepository.remove(id);
    } catch (error) {
      if (error.name === 'EntityNotFound') {
        throw new NotFoundException('Subject not found');
      }
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          name: 'subjectRemovalFailed',
        },
      });
    }
  }
}
