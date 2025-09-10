import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterClassDto, SortClassDto } from './dto/query-class.dto';
import { ClassRepository } from './infrastructure/persistence/class.repository';
import { Class } from './domain/class';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateClassDto } from './dto/update-class.dto';
import { StudentClassEnrollmentRepository } from '../students/infrastructure/persistence/relational/repositories/student-class-enrollment.repository';

@Injectable()
export class ClassesService {
  constructor(
    private readonly classesRepository: ClassRepository,
    private readonly enrollmentRepository: StudentClassEnrollmentRepository,
  ) {}

  async create(createClassDto: CreateClassDto): Promise<Class> {
    const existingClass = await this.classesRepository.findByName(
      createClassDto.name,
    );
    if (existingClass) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          name: 'classNameAlreadyExists',
        },
      });
    }

    // Transform DTO to domain format
    const classData: Partial<Class> = {
      name: createClassDto.name,
      batchTerm: createClassDto.batchTerm,
      weekdays: createClassDto.weekdays,
      timing: createClassDto.timing,
      timezone: createClassDto.timezone,
      courseOutline: createClassDto.courseOutline,
      feeUSD: createClassDto.feeUSD,
      feePKR: createClassDto.feePKR,
      classMode: createClassDto.classMode,
      schedules: createClassDto.schedules as any,
      subject: createClassDto.subject as any,
      teacher: createClassDto.teacher as any,
    };

    return this.classesRepository.create(classData);
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
    return this.classesRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Class['id']): Promise<NullableType<Class>> {
    return this.classesRepository.findById(id);
  }

  async findByName(name: Class['name']): Promise<NullableType<Class>> {
    return this.classesRepository.findByName(name);
  }

  async update(
    id: Class['id'],
    updateClassDto: UpdateClassDto,
  ): Promise<Class | null> {
    if (updateClassDto.name) {
      const existingClass = await this.classesRepository.findByName(
        updateClassDto.name,
      );
      if (existingClass && existingClass.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            name: 'classNameAlreadyExists',
          },
        });
      }
    }

    // Transform DTO to domain format
    const classData: Partial<Class> = {
      ...updateClassDto,
      subject: updateClassDto.subject as any,
      teacher: updateClassDto.teacher as any,
      schedules: updateClassDto.schedules as any,
    };

    return this.classesRepository.update(id, classData);
  }

  async remove(id: Class['id']): Promise<void> {
    await this.classesRepository.remove(id);
  }

  // New method for getting class enrollments
  async getEnrollments(classId: number): Promise<any[]> {
    // Check if class exists
    const classEntity = await this.classesRepository.findById(classId);
    if (!classEntity) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          class: 'classNotExists',
        },
      });
    }

    // Get enrollments with student details
    return this.enrollmentRepository.findByClassId(classId);
  }

  async bulkEnroll(
    classId: number,
    body: { studentIds: number[]; status?: string; enrollmentDate?: string },
  ): Promise<{ count: number }> {
    const classEntity = await this.classesRepository.findById(classId);
    if (!classEntity) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { class: 'classNotExists' },
      });
    }

    const status = (body.status as any) || 'active';
    const date = body.enrollmentDate
      ? new Date(body.enrollmentDate)
      : new Date();

    let created = 0;
    for (const studentId of body.studentIds || []) {
      try {
        // skip existing if found
        const exists = await this.enrollmentRepository.findByStudentAndClass(
          studentId,
          classId,
        );
        if (exists) continue;

        await this.enrollmentRepository.create({
          studentId,
          classId,
          status,
          enrollmentDate: date,
        });
        created += 1;
      } catch (e: any) {
        // ignore unique violations to make bulk idempotent
        if (e?.code === '23505') {
          continue;
        }
        throw e;
      }
    }
    return { count: created };
  }
}
