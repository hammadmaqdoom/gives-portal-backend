import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
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
import { SubjectsService } from '../subjects/subjects.service';
import { TeachersService } from '../teachers/teachers.service';

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
    private readonly subjectsService: SubjectsService,
    private readonly teachersService: TeachersService,
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

  async bulkCreateFromFile(file: Express.Multer.File): Promise<{
    totalRows: number;
    successful: number;
    failed: number;
    results: Array<{
      row: number;
      className: string;
      status: 'success' | 'error' | 'skipped';
      message: string;
      classId?: number;
    }>;
  }> {
    // Parse the file
    let rows: any[] = [];

    try {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        const workbook = XLSX.read(file.buffer, {
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
        });
      } else if (
        file.mimetype ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')
      ) {
        const workbook = XLSX.read(file.buffer, {
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
        });
      } else {
        throw new BadRequestException(
          'Invalid file type. Please upload a CSV or Excel file.',
        );
      }
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to parse file: ${error.message || 'Unknown error'}`,
      );
    }

    if (!rows || rows.length === 0) {
      throw new BadRequestException('File is empty or contains no data');
    }

    const results: Array<{
      row: number;
      className: string;
      status: 'success' | 'error' | 'skipped';
      message: string;
      classId?: number;
    }> = [];

    let successful = 0;
    let failed = 0;

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

      try {
        // Extract and normalize data
        const name =
          row['Name'] ||
          row['name'] ||
          row['Class Name'] ||
          row['ClassName'] ||
          '';
        const batchTerm =
          row['Batch/Term'] ||
          row['Batch/Term'] ||
          row['BatchTerm'] ||
          row['batch_term'] ||
          row['Batch'] ||
          '';
        const subjectIdStr =
          row['Subject ID'] ||
          row['SubjectID'] ||
          row['subject_id'] ||
          row['Subject'] ||
          '';
        const teacherIdStr =
          row['Teacher ID'] ||
          row['TeacherID'] ||
          row['teacher_id'] ||
          row['Teacher'] ||
          '';
        const feeUSDStr =
          row['Fee USD'] ||
          row['FeeUSD'] ||
          row['fee_usd'] ||
          row['Fee USD'] ||
          '';
        const feePKRStr =
          row['Fee PKR'] ||
          row['FeePKR'] ||
          row['fee_pkr'] ||
          row['Fee PKR'] ||
          '';
        const classMode =
          row['Class Mode'] ||
          row['ClassMode'] ||
          row['class_mode'] ||
          row['Mode'] ||
          '';
        const weekdays =
          row['Weekdays'] ||
          row['weekdays'] ||
          row['Days'] ||
          '';
        const timing =
          row['Timing'] ||
          row['timing'] ||
          row['Time'] ||
          '';
        const timezone =
          row['Timezone'] ||
          row['timezone'] ||
          row['Time Zone'] ||
          '';
        const courseOutline =
          row['Course Outline'] ||
          row['CourseOutline'] ||
          row['course_outline'] ||
          row['Outline'] ||
          '';
        const isPublicForSaleStr =
          row['Is Public For Sale'] ||
          row['IsPublicForSale'] ||
          row['is_public_for_sale'] ||
          row['Public'] ||
          'false';
        const thumbnailUrl =
          row['Thumbnail URL'] ||
          row['ThumbnailURL'] ||
          row['thumbnail_url'] ||
          row['Thumbnail'] ||
          '';
        const coverImageUrl =
          row['Cover Image URL'] ||
          row['CoverImageURL'] ||
          row['cover_image_url'] ||
          row['Cover Image'] ||
          '';

        // Validation
        if (!name || name.trim() === '') {
          results.push({
            row: rowNumber,
            className: name || 'Unknown',
            status: 'error',
            message: 'Name is required',
          });
          failed++;
          continue;
        }

        if (!batchTerm || batchTerm.trim() === '') {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: 'Batch/Term is required',
          });
          failed++;
          continue;
        }

        if (!subjectIdStr || subjectIdStr.trim() === '') {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: 'Subject ID is required',
          });
          failed++;
          continue;
        }

        const subjectId = parseInt(subjectIdStr.trim(), 10);
        if (isNaN(subjectId)) {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: 'Subject ID must be a valid number',
          });
          failed++;
          continue;
        }

        // Validate subject exists
        const subject = await this.subjectsService.findById(subjectId);
        if (!subject) {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: `Subject ID ${subjectId} not found`,
          });
          failed++;
          continue;
        }

        if (!teacherIdStr || teacherIdStr.trim() === '') {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: 'Teacher ID is required',
          });
          failed++;
          continue;
        }

        const teacherId = parseInt(teacherIdStr.trim(), 10);
        if (isNaN(teacherId)) {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: 'Teacher ID must be a valid number',
          });
          failed++;
          continue;
        }

        // Validate teacher exists
        const teacher = await this.teachersService.findById(teacherId);
        if (!teacher) {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: `Teacher ID ${teacherId} not found`,
          });
          failed++;
          continue;
        }

        if (!feeUSDStr || feeUSDStr.trim() === '') {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: 'Fee USD is required',
          });
          failed++;
          continue;
        }

        const feeUSD = parseFloat(feeUSDStr.trim());
        if (isNaN(feeUSD) || feeUSD < 0) {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: 'Fee USD must be a valid positive number',
          });
          failed++;
          continue;
        }

        if (!feePKRStr || feePKRStr.trim() === '') {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: 'Fee PKR is required',
          });
          failed++;
          continue;
        }

        const feePKR = parseFloat(feePKRStr.trim());
        if (isNaN(feePKR) || feePKR < 0) {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: 'Fee PKR must be a valid positive number',
          });
          failed++;
          continue;
        }

        if (!classMode || classMode.trim() === '') {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: 'Class Mode is required (virtual or in-person)',
          });
          failed++;
          continue;
        }

        if (classMode.trim() !== 'virtual' && classMode.trim() !== 'in-person') {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'error',
            message: 'Class Mode must be either "virtual" or "in-person"',
          });
          failed++;
          continue;
        }

        // Check if class already exists
        const existingClass = await this.classesRepository.findByName(
          name.trim(),
        );
        if (existingClass) {
          results.push({
            row: rowNumber,
            className: name.trim(),
            status: 'skipped',
            message: 'Class with this name already exists',
            classId: existingClass.id,
          });
          failed++;
          continue;
        }

        // Parse optional fields
        const weekdaysArray = weekdays
          ? weekdays.split(';').map((d: string) => d.trim()).filter((d: string) => d)
          : undefined;
        const isPublicForSale = isPublicForSaleStr.toLowerCase() === 'true';

        // Create class
        const createClassDto: CreateClassDto = {
          name: name.trim(),
          batchTerm: batchTerm.trim(),
          subject: { id: subjectId },
          teacher: { id: teacherId },
          feeUSD,
          feePKR,
          classMode: classMode.trim() as 'virtual' | 'in-person',
          weekdays: weekdaysArray,
          timing: timing?.trim() || undefined,
          timezone: timezone?.trim() || undefined,
          courseOutline: courseOutline?.trim() || undefined,
          isPublicForSale,
          thumbnailUrl: thumbnailUrl?.trim() || undefined,
          coverImageUrl: coverImageUrl?.trim() || undefined,
        };

        const createdClass = await this.create(createClassDto);

        results.push({
          row: rowNumber,
          className: createdClass.name,
          status: 'success',
          message: 'Class created successfully',
          classId: createdClass.id,
        });
        successful++;
      } catch (error: any) {
        const className =
          row['Name'] ||
          row['name'] ||
          row['Class Name'] ||
          row['ClassName'] ||
          'Unknown';

        results.push({
          row: rowNumber,
          className,
          status: 'error',
          message:
            error.message ||
            error.response?.message ||
            'Failed to create class',
        });
        failed++;
      }
    }

    return {
      totalRows: rows.length,
      successful,
      failed,
      results,
    };
  }
}
