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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningModuleEntity } from '../learning-modules/infrastructure/persistence/relational/entities/learning-module.entity';
import { LearningModuleSectionEntity } from '../learning-modules/infrastructure/persistence/relational/entities/learning-module-section.entity';
import { AssignmentEntity } from '../assignments/infrastructure/persistence/relational/entities/assignment.entity';

@Injectable()
export class ClassesService {
  constructor(
    private readonly classesRepository: ClassRepository,
    private readonly enrollmentRepository: StudentClassEnrollmentRepository,
    @InjectRepository(LearningModuleEntity)
    private readonly moduleRepo: Repository<LearningModuleEntity>,
    @InjectRepository(LearningModuleSectionEntity)
    private readonly sectionRepo: Repository<LearningModuleSectionEntity>,
    @InjectRepository(AssignmentEntity)
    private readonly assignmentRepo: Repository<AssignmentEntity>,
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
      isPublicForSale: createClassDto.isPublicForSale,
      thumbnailUrl: createClassDto.thumbnailUrl,
      coverImageUrl: createClassDto.coverImageUrl,
      features: createClassDto.features,
    } as any;

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

  // Duplicate class with sections and modules (no schedules, no enrollments)
  async duplicate(id: number): Promise<Class> {
    const original = await this.classesRepository.findById(id);
    if (!original) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { class: 'classNotExists' },
      });
    }

    const newName = `${original.name}-copy`;
    const duplicateClass = await this.classesRepository.create({
      name: newName,
      batchTerm: original.batchTerm,
      weekdays: original.weekdays,
      timing: undefined,
      timezone: original.timezone,
      courseOutline: original.courseOutline,
      feeUSD: (original as any).feeUSD,
      feePKR: (original as any).feePKR,
      classMode: (original as any).classMode,
      subject: original.subject as any,
      teacher: original.teacher as any,
      schedules: [],
    });

    // Map sections by old->new
    const sections = await this.sectionRepo.find({
      where: { classId: id },
      order: { orderIndex: 'ASC', id: 'ASC' } as any,
    });
    const sectionIdMap = new Map<number, number>();
    for (const s of sections) {
      const created = await this.sectionRepo.save(
        this.sectionRepo.create({
          classId: duplicateClass.id,
          title: s.title,
          orderIndex: s.orderIndex ?? 0,
        }),
      );
      sectionIdMap.set(s.id, created.id);
    }

    // Copy modules (preserve drip configuration)
    const modules = await this.moduleRepo.find({
      where: { classId: id } as any,
      order: { orderIndex: 'ASC', id: 'ASC' },
    });
    for (const m of modules) {
      const newSectionId = m.sectionId
        ? sectionIdMap.get(m.sectionId) || null
        : null;
      await this.moduleRepo.save(
        this.moduleRepo.create({
          title: m.title,
          contentHtml: (m as any).contentHtml,
          orderIndex: m.orderIndex,
          groupId: (m as any).groupId,
          videoUrl: m.videoUrl,
          attachments: (m as any).attachments,
          classId: duplicateClass.id,
          sectionId: newSectionId as any,
          isPinned: (m as any).isPinned ?? false,
          zoomMeetingId: null,
          zoomMeetingUrl: null,
          zoomMeetingPassword: null,
          zoomMeetingStartTime: null,
          zoomMeetingDuration: null,
          // preserve drip configuration exactly
          dripEnabled: (m as any).dripEnabled ?? false,
          dripReleaseDate: (m as any).dripReleaseDate ?? null,
          dripPrerequisites: (m as any).dripPrerequisites ?? null,
          dripDelayDays: (m as any).dripDelayDays ?? null,
        } as any),
      );
    }

    // Copy assignments created by admin/teacher (owned by class)
    const assignments = await this.assignmentRepo.find({
      where: { class: { id } } as any,
      order: { id: 'ASC' },
    });
    for (const a of assignments) {
      await this.assignmentRepo.save(
        this.assignmentRepo.create({
          title: a.title,
          description: a.description,
          dueDate: a.dueDate,
          type: a.type as any,
          status: a.status as any,
          maxScore: a.maxScore,
          markingCriteria: a.markingCriteria,
          attachments: a.attachments as any,
          class: { id: duplicateClass.id } as any,
          teacher: a.teacher
            ? ({ id: (a.teacher as any).id } as any)
            : undefined,
        } as any),
      );
    }

    return duplicateClass;
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

  /**
   * Get price for a class based on currency
   */
  getPriceForCurrency(classEntity: Class, currency: string): number {
    return currency === 'PKR' ? classEntity.feePKR : classEntity.feeUSD;
  }

  /**
   * Find public classes for sale
   */
  async findPublicClassesForSale(
    currency: string,
    filterOptions?: FilterClassDto | null,
    paginationOptions?: IPaginationOptions,
  ): Promise<Class[]> {
    // Add isPublicForSale filter
    const filters: any = {
      ...filterOptions,
      isPublicForSale: true,
    };

    const classes = await this.classesRepository.findManyWithPagination({
      filterOptions: filters,
      sortOptions: null,
      paginationOptions: paginationOptions || { page: 1, limit: 12 },
    });

    // Transform to include currency-aware price
    return classes.map((cls) => ({
      ...cls,
      price: this.getPriceForCurrency(cls, currency),
      currency,
    })) as any;
  }
}
