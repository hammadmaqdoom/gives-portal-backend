import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterAttendanceDto,
  SortAttendanceDto,
} from './dto/query-attendance.dto';
import { AttendanceRepository } from './infrastructure/persistence/attendance.repository';
import { Attendance, AttendanceMatchedBy } from './domain/attendance';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditEventType } from '../audit-logs/entities/audit-log.entity';

export interface AttendanceActorContext {
  userId?: number | null;
  userEmail?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Extra fields that callers (Quick Attendance UI) can tag onto a bulk item
 * so the attendance record can be audited with face-recognition confidence.
 * These live outside the persisted domain to keep the attendance table
 * minimal — the data is captured in the audit log.
 */
export type BulkAttendanceItem = Partial<Attendance> & {
  id?: number;
  matchDistance?: number | null;
  matchModelName?: string | null;
};

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    createAttendanceDto: CreateAttendanceDto,
    actor: AttendanceActorContext = {},
  ): Promise<Attendance> {
    // Check if attendance already exists for this student, date, and class
    const existingAttendance =
      await this.attendanceRepository.findByStudentDateAndClass(
        createAttendanceDto.student,
        createAttendanceDto.date,
        createAttendanceDto.class,
      );

    if (existingAttendance) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          attendance: 'attendanceAlreadyExistsForDateAndClass',
        },
      });
    }

    const attendanceData: Partial<Attendance> = {
      date: createAttendanceDto.date,
      status: createAttendanceDto.status,
      notes: createAttendanceDto.notes,
      matchedBy: createAttendanceDto.matchedBy,
      student: { id: createAttendanceDto.student } as any,
      class: { id: createAttendanceDto.class } as any,
    };

    const created = await this.attendanceRepository.create(attendanceData);
    await this.writeFaceMatchAudit({
      attendance: created,
      matchedBy: createAttendanceDto.matchedBy,
      matchDistance: createAttendanceDto.matchDistance,
      matchModelName: createAttendanceDto.matchModelName,
      actor,
    });
    return created;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterAttendanceDto | null;
    sortOptions?: SortAttendanceDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Attendance[]> {
    return this.attendanceRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Attendance['id']): Promise<NullableType<Attendance>> {
    return this.attendanceRepository.findById(id);
  }

  async findByStudentAndDate(
    studentId: number,
    date: Date,
  ): Promise<NullableType<Attendance>> {
    return this.attendanceRepository.findByStudentAndDate(studentId, date);
  }

  async findByClassAndDate(classId: number, date: Date): Promise<Attendance[]> {
    return this.attendanceRepository.findByClassAndDate(classId, date);
  }

  async findByStudentAndClass(
    studentId: number,
    classId: number,
  ): Promise<Attendance[]> {
    return this.attendanceRepository.findByStudentAndClass(studentId, classId);
  }

  async findByDate(
    date: Date,
    classId?: number,
    studentId?: number,
  ): Promise<Attendance[] | NullableType<Attendance>> {
    if (studentId) {
      return this.attendanceRepository.findByStudentAndDate(studentId, date);
    }
    if (classId) {
      return this.attendanceRepository.findByClassAndDate(classId, date);
    }
    return this.attendanceRepository.findManyWithPagination({
      filterOptions: { date } as any,
      sortOptions: null,
      paginationOptions: { page: 1, limit: 100 },
    });
  }

  async update(
    id: Attendance['id'],
    updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<Attendance | null> {
    const attendanceData: Partial<Attendance> = {
      ...updateAttendanceDto,
      student: updateAttendanceDto.student
        ? ({ id: updateAttendanceDto.student } as any)
        : undefined,
      class: updateAttendanceDto.class
        ? ({ id: updateAttendanceDto.class } as any)
        : undefined,
    };

    return this.attendanceRepository.update(id, attendanceData);
  }

  async remove(id: Attendance['id']): Promise<void> {
    await this.attendanceRepository.remove(id);
  }

  async bulkUpdate(
    items: BulkAttendanceItem[],
    actor: AttendanceActorContext = {},
  ): Promise<{ updated: number; created: number }> {
    let updated = 0;
    let created = 0;
    for (const item of items) {
      const { matchDistance, matchModelName, ...attendanceFields } = item;
      if (attendanceFields.id) {
        const existingBefore = await this.attendanceRepository.findById(
          attendanceFields.id,
        );
        // eslint-disable-next-line no-await-in-loop
        const next = await this.attendanceRepository.update(
          attendanceFields.id,
          attendanceFields,
        );
        updated += 1;
        // eslint-disable-next-line no-await-in-loop
        await this.writeFaceMatchAudit({
          attendance: next ?? (existingBefore as any),
          matchedBy: attendanceFields.matchedBy as AttendanceMatchedBy | undefined,
          matchDistance,
          matchModelName,
          actor,
        });
      } else if (attendanceFields.student && attendanceFields.class && attendanceFields.date) {
        const studentId =
          (attendanceFields.student as any).id ?? (attendanceFields as any).student;
        const classId =
          (attendanceFields.class as any).id ?? (attendanceFields as any).class;
        const date = attendanceFields.date as any;

        // eslint-disable-next-line no-await-in-loop
        const existing = await this.attendanceRepository.findByStudentDateAndClass(
          studentId,
          date,
          classId,
        );
        let row: Attendance | null;
        if (existing) {
          // eslint-disable-next-line no-await-in-loop
          row = await this.attendanceRepository.update(
            existing.id,
            attendanceFields,
          );
          updated += 1;
        } else {
          // eslint-disable-next-line no-await-in-loop
          row = await this.attendanceRepository.create(attendanceFields);
          created += 1;
        }
        // eslint-disable-next-line no-await-in-loop
        await this.writeFaceMatchAudit({
          attendance: row,
          matchedBy: attendanceFields.matchedBy as AttendanceMatchedBy | undefined,
          matchDistance,
          matchModelName,
          actor,
        });
      }
    }
    return { updated, created };
  }

  /**
   * Write an audit-log row for a face-recognition-produced attendance mark.
   * Non-face / manual / QR marks are skipped to keep the audit view focused
   * on the biometric pipeline. Any failure is swallowed by AuditLogsService
   * so attendance writes stay atomic from the caller's perspective.
   */
  private async writeFaceMatchAudit(params: {
    attendance: Attendance | null | undefined;
    matchedBy: AttendanceMatchedBy | string | undefined | null;
    matchDistance?: number | null;
    matchModelName?: string | null;
    actor: AttendanceActorContext;
  }): Promise<void> {
    const { attendance, matchedBy, matchDistance, matchModelName, actor } = params;
    if (!attendance || !matchedBy) return;
    if (matchedBy !== AttendanceMatchedBy.FACE) return;

    const studentId =
      (attendance as any).student?.id ?? (attendance as any).studentId ?? null;
    const classId =
      (attendance as any).class?.id ?? (attendance as any).classId ?? null;

    await this.auditLogsService.create({
      eventType: AuditEventType.FACE_MATCH,
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      userRole: actor.userRole ?? null,
      resource: 'attendance',
      resourceId: attendance.id ? String(attendance.id) : null,
      ipAddress: actor.ipAddress ?? null,
      userAgent: actor.userAgent ?? null,
      details: {
        studentId,
        classId,
        status: attendance.status,
        date: attendance.date,
        matchDistance: matchDistance ?? null,
        // Confidence is a UI-friendly companion: 1.0 at distance 0, degrading
        // linearly toward threshold. Actual decisioning stays on distance.
        matchConfidence:
          typeof matchDistance === 'number'
            ? Math.max(0, 1 - matchDistance)
            : null,
        modelName: matchModelName ?? null,
      },
    });
  }
}
