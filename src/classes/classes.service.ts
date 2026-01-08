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
import { CreateClassScheduleDto } from './dto/class-schedule.dto';
import { Weekday } from './infrastructure/persistence/relational/entities/class-schedule.entity';
import { FileStorageService } from '../files/file-storage.service';
import { FileDriver } from '../files/config/file-config.type';
import { ConfigService } from '@nestjs/config';

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
    private readonly fileStorageService: FileStorageService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Normalize weekday name to lowercase enum value
   */
  private normalizeWeekday(day: string): Weekday | null {
    const normalized = day.trim().toLowerCase();
    const weekdayMap: Record<string, Weekday> = {
      monday: Weekday.MONDAY,
      tuesday: Weekday.TUESDAY,
      wednesday: Weekday.WEDNESDAY,
      thursday: Weekday.THURSDAY,
      friday: Weekday.FRIDAY,
      saturday: Weekday.SATURDAY,
      sunday: Weekday.SUNDAY,
      mon: Weekday.MONDAY,
      tue: Weekday.TUESDAY,
      wed: Weekday.WEDNESDAY,
      thu: Weekday.THURSDAY,
      fri: Weekday.FRIDAY,
      sat: Weekday.SATURDAY,
      sun: Weekday.SUNDAY,
    };
    return weekdayMap[normalized] || null;
  }

  /**
   * Parse weekdays string (semicolon-separated) and return normalized array
   */
  private parseWeekdays(weekdaysStr: string): Weekday[] {
    if (!weekdaysStr || !weekdaysStr.trim()) {
      return [];
    }
    return weekdaysStr
      .split(';')
      .map((d) => this.normalizeWeekday(d))
      .filter((d): d is Weekday => d !== null);
  }

  /**
   * Convert 12-hour time format to 24-hour format (HH:MM)
   * Handles formats like: "7:00PM", "7:00 PM", "19:00", etc.
   */
  private convertTo24Hour(timeStr: string): string | null {
    if (!timeStr || !timeStr.trim()) {
      return null;
    }

    const trimmed = timeStr.trim().toUpperCase();
    
    // If already in 24-hour format (HH:MM), return as-is
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      const [hours, minutes] = trimmed.split(':');
      const hour = parseInt(hours, 10);
      if (hour >= 0 && hour <= 23 && parseInt(minutes, 10) >= 0 && parseInt(minutes, 10) <= 59) {
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
      }
    }

    // Parse 12-hour format with AM/PM
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (!match) {
      return null;
    }

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3];

    if (hours < 1 || hours > 12) {
      return null;
    }

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  /**
   * Parse timing string to extract time ranges
   * Handles formats like: "7:00PM-8:00PM", "7:00PM-8:00PM;9:00PM-10:00PM", etc.
   */
  private parseTiming(timingStr: string): Array<{ startTime: string; endTime: string }> {
    if (!timingStr || !timingStr.trim()) {
      return [];
    }

    const ranges: Array<{ startTime: string; endTime: string }> = [];
    
    // Split by semicolon to handle multiple time ranges
    const timeRanges = timingStr.split(';').map(t => t.trim()).filter(t => t);
    
    for (const timeRange of timeRanges) {
      // Split by hyphen to get start and end times
      const parts = timeRange.split('-').map(t => t.trim()).filter(t => t);
      
      if (parts.length >= 2) {
        const startTime = this.convertTo24Hour(parts[0]);
        const endTime = this.convertTo24Hour(parts[1]);
        
        // Only add if both times are valid
        if (startTime && endTime) {
          ranges.push({ startTime, endTime });
        }
      }
    }

    return ranges;
  }

  /**
   * Convert weekdays and timing to schedule objects
   */
  private convertToSchedules(
    weekdays: Weekday[],
    timing: string,
    timezone: string = 'Asia/Karachi',
  ): CreateClassScheduleDto[] {
    const schedules: CreateClassScheduleDto[] = [];
    
    if (weekdays.length === 0 || !timing) {
      return schedules;
    }

    const timeRanges = this.parseTiming(timing);
    
    if (timeRanges.length === 0) {
      return schedules;
    }

    // Create a schedule for each weekday and time range combination
    for (const weekday of weekdays) {
      for (const timeRange of timeRanges) {
        schedules.push({
          weekday,
          startTime: timeRange.startTime,
          endTime: timeRange.endTime,
          timezone: timezone || 'Asia/Karachi',
          isActive: true,
        });
      }
    }

    return schedules;
  }

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
      thumbnailFileId: createClassDto.thumbnailFileId,
      coverImageFileId: createClassDto.coverImageFileId,
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
    const classes = await this.classesRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
    
    // Enrich all classes with proper image URLs
    await Promise.all(classes.map(cls => this.enrichClassWithImageUrls(cls)));
    
    return classes;
  }

  async findById(id: Class['id']): Promise<NullableType<Class>> {
    const classEntity = await this.classesRepository.findById(id);
    if (classEntity) {
      await this.enrichClassWithImageUrls(classEntity);
    }
    return classEntity;
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

    // Enrich all classes with proper image URLs
    await Promise.all(classes.map(cls => this.enrichClassWithImageUrls(cls)));

    // Transform to include currency-aware price
    return classes.map((cls) => ({
      ...cls,
      price: this.getPriceForCurrency(cls, currency),
      currency,
    })) as any;
  }

  /**
   * Get base URL for the current server
   */
  private getBaseUrl(): string {
    const protocol = this.configService.get('app.protocol') || 'http';
    const host = this.configService.get('app.host') || 'localhost';
    const port = this.configService.get('app.port') || 3000;
    return `${protocol}://${host}:${port}`;
  }

  /**
   * Enrich class with proper image URLs (presigned for S3, serve endpoint for local)
   */
  private async enrichClassWithImageUrls(classEntity: Class): Promise<void> {
    const fileDriver = await this.fileStorageService.getDriver();
    const baseUrl = this.getBaseUrl();

    // Handle thumbnail file
    if ((classEntity as any).thumbnailFile) {
      const thumbnailFile = (classEntity as any).thumbnailFile;
      
      if (fileDriver === FileDriver.LOCAL) {
        // For local files, use the serve endpoint
        thumbnailFile.url = `${baseUrl}/api/v1/files/serve/${thumbnailFile.id}`;
      } else if (
        fileDriver === FileDriver.S3 ||
        fileDriver === FileDriver.S3_PRESIGNED
      ) {
        // For S3 files, generate presigned URL
        try {
          thumbnailFile.url = await this.fileStorageService.getPresignedFileUrl(
            thumbnailFile.path,
            3600, // 1 hour expiry
          );
        } catch (error) {
          console.error('Error generating presigned URL for thumbnail:', error);
          // Fallback to serve endpoint if presigned URL generation fails
          thumbnailFile.url = `${baseUrl}/api/v1/files/serve/${thumbnailFile.id}`;
        }
      } else {
        // Fallback for other storage types
        thumbnailFile.url = `${baseUrl}/api/v1/files/serve/${thumbnailFile.id}`;
      }
    }

    // Handle cover image file
    if ((classEntity as any).coverImageFile) {
      const coverImageFile = (classEntity as any).coverImageFile;
      
      if (fileDriver === FileDriver.LOCAL) {
        // For local files, use the serve endpoint
        coverImageFile.url = `${baseUrl}/api/v1/files/serve/${coverImageFile.id}`;
      } else if (
        fileDriver === FileDriver.S3 ||
        fileDriver === FileDriver.S3_PRESIGNED
      ) {
        // For S3 files, generate presigned URL
        try {
          coverImageFile.url = await this.fileStorageService.getPresignedFileUrl(
            coverImageFile.path,
            3600, // 1 hour expiry
          );
        } catch (error) {
          console.error('Error generating presigned URL for cover image:', error);
          // Fallback to serve endpoint if presigned URL generation fails
          coverImageFile.url = `${baseUrl}/api/v1/files/serve/${coverImageFile.id}`;
        }
      } else {
        // Fallback for other storage types
        coverImageFile.url = `${baseUrl}/api/v1/files/serve/${coverImageFile.id}`;
      }
    }
  }

  async bulkCreateFromData(
    classes: Array<{
      name: string;
      batchTerm: string;
      subjectId: number;
      teacherId: number;
      feeUSD: number;
      feePKR: number;
      classMode: 'virtual' | 'in-person' | 'hybrid';
      weekdays?: string[];
      timing?: string;
      timezone?: string;
      schedules?: CreateClassScheduleDto[];
      courseOutline?: string;
      isPublicForSale?: boolean;
      thumbnailUrl?: string;
      coverImageUrl?: string;
    }>,
    duplicateHandling: 'skip' | 'update' = 'skip',
  ): Promise<{
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
    if (!classes || classes.length === 0) {
      throw new BadRequestException('No classes provided');
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

    // Process each class
    for (let i = 0; i < classes.length; i++) {
      const classData = classes[i];
      const rowNumber = i + 1;

      try {
        // Validation
        if (!classData.name || classData.name.trim() === '') {
          results.push({
            row: rowNumber,
            className: classData.name || 'Unknown',
            status: 'error',
            message: 'Name is required',
          });
          failed++;
          continue;
        }

        if (!classData.batchTerm || classData.batchTerm.trim() === '') {
          results.push({
            row: rowNumber,
            className: classData.name.trim(),
            status: 'error',
            message: 'Batch/Term is required',
          });
          failed++;
          continue;
        }

        if (!classData.subjectId || isNaN(classData.subjectId)) {
          results.push({
            row: rowNumber,
            className: classData.name.trim(),
            status: 'error',
            message: 'Valid Subject ID is required',
          });
          failed++;
          continue;
        }

        if (!classData.teacherId || isNaN(classData.teacherId)) {
          results.push({
            row: rowNumber,
            className: classData.name.trim(),
            status: 'error',
            message: 'Valid Teacher ID is required',
          });
          failed++;
          continue;
        }

        if (
          classData.feeUSD === undefined ||
          isNaN(classData.feeUSD) ||
          classData.feeUSD < 0
        ) {
          results.push({
            row: rowNumber,
            className: classData.name.trim(),
            status: 'error',
            message: 'Fee USD must be a valid positive number',
          });
          failed++;
          continue;
        }

        if (
          classData.feePKR === undefined ||
          isNaN(classData.feePKR) ||
          classData.feePKR < 0
        ) {
          results.push({
            row: rowNumber,
            className: classData.name.trim(),
            status: 'error',
            message: 'Fee PKR must be a valid positive number',
          });
          failed++;
          continue;
        }

        if (
          !classData.classMode ||
          (classData.classMode !== 'virtual' &&
            classData.classMode !== 'in-person' &&
            classData.classMode !== 'hybrid')
        ) {
          results.push({
            row: rowNumber,
            className: classData.name.trim(),
            status: 'error',
            message:
              'Class Mode must be either "virtual", "in-person", or "hybrid"',
          });
          failed++;
          continue;
        }

        // Check if class already exists
        const existingClass = await this.classesRepository.findByName(
          classData.name.trim(),
        );
        if (existingClass) {
          if (duplicateHandling === 'skip') {
            results.push({
              row: rowNumber,
              className: classData.name.trim(),
              status: 'skipped',
              message: 'Class with this name already exists',
              classId: existingClass.id,
            });
            failed++;
            continue;
          } else {
            // Update existing class
            try {
              // Convert weekdays and timing to schedules if schedules not provided
              let schedules = classData.schedules;
              if (!schedules && classData.weekdays && classData.timing) {
                let weekdaysArray: Weekday[] = [];
                if (Array.isArray(classData.weekdays)) {
                  weekdaysArray = classData.weekdays
                    .map((d) => this.normalizeWeekday(d))
                    .filter((d): d is Weekday => d !== null);
                } else if (typeof classData.weekdays === 'string') {
                  weekdaysArray = this.parseWeekdays(classData.weekdays);
                }
                
                if (weekdaysArray.length > 0 && classData.timing) {
                  schedules = this.convertToSchedules(
                    weekdaysArray,
                    classData.timing,
                    classData.timezone || 'Asia/Karachi',
                  );
                }
              }

              const updateClassDto: UpdateClassDto = {
                name: classData.name.trim(),
                batchTerm: classData.batchTerm.trim(),
                subject: { id: classData.subjectId },
                teacher: { id: classData.teacherId },
                feeUSD: classData.feeUSD,
                feePKR: classData.feePKR,
                classMode: classData.classMode,
                weekdays: classData.weekdays,
                timing: classData.timing?.trim() || undefined,
                timezone: classData.timezone?.trim() || undefined,
                schedules: schedules || undefined,
                courseOutline: classData.courseOutline?.trim() || undefined,
                isPublicForSale: classData.isPublicForSale,
                thumbnailUrl: classData.thumbnailUrl?.trim() || undefined,
                coverImageUrl: classData.coverImageUrl?.trim() || undefined,
              };

              const updatedClass = await this.update(existingClass.id, updateClassDto);
              
              results.push({
                row: rowNumber,
                className: updatedClass!.name,
                status: 'success',
                message: 'Class updated successfully',
                classId: updatedClass!.id,
              });
              successful++;
              continue;
            } catch (error: any) {
              results.push({
                row: rowNumber,
                className: classData.name.trim(),
                status: 'error',
                message: `Failed to update: ${error.message || 'Unknown error'}`,
                classId: existingClass.id,
              });
              failed++;
              continue;
            }
          }
        }

        // Convert weekdays and timing to schedules if schedules not provided
        let schedules = classData.schedules;
        if (!schedules && classData.weekdays && classData.timing) {
          // Parse weekdays - handle both array and string formats
          let weekdaysArray: Weekday[] = [];
          if (Array.isArray(classData.weekdays)) {
            weekdaysArray = classData.weekdays
              .map((d) => this.normalizeWeekday(d))
              .filter((d): d is Weekday => d !== null);
          } else if (typeof classData.weekdays === 'string') {
            weekdaysArray = this.parseWeekdays(classData.weekdays);
          }
          
          if (weekdaysArray.length > 0 && classData.timing) {
            schedules = this.convertToSchedules(
              weekdaysArray,
              classData.timing,
              classData.timezone || 'Asia/Karachi',
            );
          }
        }

        // Create class
        const createClassDto: CreateClassDto = {
          name: classData.name.trim(),
          batchTerm: classData.batchTerm.trim(),
          subject: { id: classData.subjectId },
          teacher: { id: classData.teacherId },
          feeUSD: classData.feeUSD,
          feePKR: classData.feePKR,
          classMode: classData.classMode,
          weekdays: classData.weekdays,
          timing: classData.timing?.trim() || undefined,
          timezone: classData.timezone?.trim() || undefined,
          schedules: schedules || undefined,
          courseOutline: classData.courseOutline?.trim() || undefined,
          isPublicForSale: classData.isPublicForSale,
          thumbnailUrl: classData.thumbnailUrl?.trim() || undefined,
          coverImageUrl: classData.coverImageUrl?.trim() || undefined,
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
        results.push({
          row: rowNumber,
          className: classData.name || 'Unknown',
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
      totalRows: classes.length,
      successful,
      failed,
      results,
    };
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

    // Convert parsed rows to class data format
    const classes = rows.map((row: any) => {
      const feeUSDStr = row['Fee USD'] || row['FeeUSD'] || row['fee_usd'] || '';
      const feePKRStr = row['Fee PKR'] || row['FeePKR'] || row['fee_pkr'] || '';
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
      const weekdaysStr = row['Weekdays'] || row['weekdays'] || row['Days'] || '';
      const timingStr = row['Timing'] || row['timing'] || row['Time'] || '';
      const timezoneStr =
        row['Timezone'] || row['timezone'] || row['Time Zone'] || 'Asia/Karachi';
      const isPublicForSaleStr =
        row['Is Public For Sale'] ||
        row['IsPublicForSale'] ||
        row['is_public_for_sale'] ||
        row['Public'] ||
        'false';

      // Parse weekdays and timing properly
      const parsedWeekdays = this.parseWeekdays(weekdaysStr);
      const schedules = this.convertToSchedules(
        parsedWeekdays,
        timingStr,
        timezoneStr,
      );

      return {
        name:
          row['Name'] ||
          row['name'] ||
          row['Class Name'] ||
          row['ClassName'] ||
          '',
        batchTerm:
          row['Batch/Term'] ||
          row['BatchTerm'] ||
          row['batch_term'] ||
          row['Batch'] ||
          '',
        subjectId: parseInt(subjectIdStr.trim(), 10),
        teacherId: parseInt(teacherIdStr.trim(), 10),
        feeUSD: parseFloat(feeUSDStr.trim()),
        feePKR: parseFloat(feePKRStr.trim()),
        classMode: (
          row['Class Mode'] ||
          row['ClassMode'] ||
          row['class_mode'] ||
          row['Mode'] ||
          ''
        ).trim() as 'virtual' | 'in-person',
        weekdays: parsedWeekdays.length > 0 ? parsedWeekdays.map(w => w) : undefined,
        timing: timingStr || undefined,
        timezone: timezoneStr || undefined,
        schedules: schedules.length > 0 ? schedules : undefined,
        courseOutline:
          row['Course Outline'] ||
          row['CourseOutline'] ||
          row['course_outline'] ||
          row['Outline'] ||
          undefined,
        isPublicForSale: isPublicForSaleStr.toLowerCase() === 'true',
        thumbnailUrl:
          row['Thumbnail URL'] ||
          row['ThumbnailURL'] ||
          row['thumbnail_url'] ||
          row['Thumbnail'] ||
          undefined,
        coverImageUrl:
          row['Cover Image URL'] ||
          row['CoverImageURL'] ||
          row['cover_image_url'] ||
          row['Cover Image'] ||
          undefined,
      };
    });

    return this.bulkCreateFromData(classes);
  }

  // This method is kept for backward compatibility but now uses bulkCreateFromData
  // The actual implementation was moved above - this is just a placeholder comment
  // If you see this, the legacy method was already removed
  async _removedLegacyMethod(file: Express.Multer.File): Promise<{
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
          row['Weekdays'] || row['weekdays'] || row['Days'] || '';
        const timing = row['Timing'] || row['timing'] || row['Time'] || '';
        const timezone =
          row['Timezone'] || row['timezone'] || row['Time Zone'] || '';
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
            message: `Subject with ID ${subjectId} does not exist`,
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
            message: `Teacher with ID ${teacherId} does not exist`,
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

        if (
          classMode.trim() !== 'virtual' &&
          classMode.trim() !== 'in-person'
        ) {
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
          ? weekdays
              .split(';')
              .map((d: string) => d.trim())
              .filter((d: string) => d)
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
