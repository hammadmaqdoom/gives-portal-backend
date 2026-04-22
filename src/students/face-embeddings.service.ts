import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { StudentFaceEmbeddingRepository } from './infrastructure/persistence/relational/repositories/student-face-embedding.repository';
import { StudentClassEnrollmentRepository } from './infrastructure/persistence/relational/repositories/student-class-enrollment.repository';
import { StudentRepository } from './infrastructure/persistence/student.repository';
import { FilesService } from '../files/files.service';
import { CreateFaceEmbeddingDto } from './dto/create-face-embedding.dto';
import { StudentFaceEmbedding } from './domain/student-face-embedding';
import {
  ClassFaceEmbeddingsResponseDto,
  ClassFaceEmbeddingsStudentDto,
} from './dto/face-embedding-response.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditEventType } from '../audit-logs/entities/audit-log.entity';

// Hard cap per student to bound storage and matching cost.
const MAX_EMBEDDINGS_PER_STUDENT = 10;

export interface ActorContext {
  userId?: number | null;
  userEmail?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class FaceEmbeddingsService {
  constructor(
    private readonly faceEmbeddingRepository: StudentFaceEmbeddingRepository,
    private readonly enrollmentRepository: StudentClassEnrollmentRepository,
    private readonly studentRepository: StudentRepository,
    private readonly filesService: FilesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    studentId: number,
    dto: CreateFaceEmbeddingDto,
    actor: ActorContext = {},
  ): Promise<StudentFaceEmbedding> {
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    // Hard gate on biometric consent. This is non-negotiable for GDPR/BIPA
    // compliance — no consent, no enrollment.
    if (!student.biometricConsent) {
      throw new ForbiddenException({
        status: 403,
        errors: {
          biometricConsent:
            'Student has not granted biometric consent. Record consent before enrolling face samples.',
        },
      });
    }

    const existingCount =
      await this.faceEmbeddingRepository.countByStudentId(studentId);
    if (existingCount >= MAX_EMBEDDINGS_PER_STUDENT) {
      throw new BadRequestException(
        `Student already has ${existingCount} face samples (max ${MAX_EMBEDDINGS_PER_STUDENT}). Delete one before adding more.`,
      );
    }

    const created = await this.faceEmbeddingRepository.create({
      studentId,
      embedding: dto.embedding,
      modelName: dto.modelName,
      qualityScore: dto.qualityScore,
      sourceFileId: dto.sourceFileId,
    });

    await this.auditLogsService.create({
      eventType: AuditEventType.FACE_ENROLL,
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      userRole: actor.userRole ?? null,
      resource: 'student_face_embedding',
      resourceId: String(created.id),
      ipAddress: actor.ipAddress ?? null,
      userAgent: actor.userAgent ?? null,
      details: {
        studentId,
        studentCode: student.studentId,
        embeddingId: created.id,
        modelName: created.modelName,
        qualityScore: created.qualityScore ?? null,
        sampleCount: existingCount + 1,
      },
    });

    return created;
  }

  async findByStudentId(
    studentId: number,
    includeVector = false,
  ): Promise<StudentFaceEmbedding[]> {
    const embeddings =
      await this.faceEmbeddingRepository.findByStudentId(studentId);
    if (includeVector) return embeddings;
    return embeddings.map((e) => ({ ...e, embedding: [] }));
  }

  async remove(
    studentId: number,
    embeddingId: number,
    actor: ActorContext = {},
  ): Promise<void> {
    const existing = await this.faceEmbeddingRepository.findById(embeddingId);
    if (!existing || existing.studentId !== studentId) {
      throw new NotFoundException(
        `Face embedding ${embeddingId} not found for student ${studentId}`,
      );
    }
    await this.faceEmbeddingRepository.softRemove(embeddingId);

    await this.auditLogsService.create({
      eventType: AuditEventType.FACE_UNENROLL,
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      userRole: actor.userRole ?? null,
      resource: 'student_face_embedding',
      resourceId: String(embeddingId),
      ipAddress: actor.ipAddress ?? null,
      userAgent: actor.userAgent ?? null,
      details: {
        studentId,
        embeddingId,
        modelName: existing.modelName,
      },
    });
  }

  async removeAllForStudent(
    studentId: number,
    actor: ActorContext = {},
  ): Promise<void> {
    const existingCount =
      await this.faceEmbeddingRepository.countByStudentId(studentId);
    await this.faceEmbeddingRepository.softRemoveByStudentId(studentId);

    await this.auditLogsService.create({
      eventType: AuditEventType.FACE_UNENROLL_ALL,
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      userRole: actor.userRole ?? null,
      resource: 'student',
      resourceId: String(studentId),
      ipAddress: actor.ipAddress ?? null,
      userAgent: actor.userAgent ?? null,
      details: {
        studentId,
        removedCount: existingCount,
      },
    });
  }

  async getClassEmbeddings(
    classId: number,
  ): Promise<ClassFaceEmbeddingsResponseDto> {
    const enrollments = await this.enrollmentRepository.findByClassId(classId);

    const students = enrollments
      .map((e) => e.student)
      .filter(
        (s): s is NonNullable<typeof s> => !!s && (s as any).id !== undefined,
      );

    const studentIds = students.map((s) => (s as any).id as number);

    const allEmbeddings =
      await this.faceEmbeddingRepository.findByStudentIds(studentIds);

    const byStudent = new Map<number, StudentFaceEmbedding[]>();
    for (const e of allEmbeddings) {
      const list = byStudent.get(e.studentId) ?? [];
      list.push(e);
      byStudent.set(e.studentId, list);
    }

    const studentEntries: ClassFaceEmbeddingsStudentDto[] = await Promise.all(
      students.map(async (s) => {
        const sid = (s as any).id as number;
        const list = byStudent.get(sid) ?? [];

        // Resolve photo URL if student has one, for the review UI.
        let photoUrl: string | null = null;
        const full = await this.studentRepository.findById(sid);
        if (full?.photo) {
          try {
            photoUrl = this.filesService.getFileUrl(full.photo as any);
          } catch {
            photoUrl = null;
          }
        }

        return {
          studentId: sid,
          name: (s as any).name ?? 'Unknown',
          studentCode: (s as any).studentId ?? null,
          photoUrl,
          embeddings: list.map((l) => l.embedding),
          modelName: list[0]?.modelName ?? '',
          biometricConsent: full?.biometricConsent ?? false,
          biometricConsentAt: full?.biometricConsentAt ?? null,
        };
      }),
    );

    return { classId, students: studentEntries };
  }

  /**
   * Grant or revoke biometric consent for a student. Revocation also wipes
   * any enrolled face samples because continuing to hold them would violate
   * the revocation semantics under GDPR / BIPA.
   */
  async updateBiometricConsent(
    studentId: number,
    consent: boolean,
    actor: ActorContext = {},
    note?: string,
  ): Promise<{
    studentId: number;
    biometricConsent: boolean;
    biometricConsentAt: Date | null;
    biometricConsentBy: number | null;
  }> {
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    const now = new Date();
    const updated = await this.studentRepository.update(studentId, {
      biometricConsent: consent,
      biometricConsentAt: now,
      biometricConsentBy: actor.userId ?? null,
    });

    let wipedSamples = 0;
    if (!consent) {
      wipedSamples =
        await this.faceEmbeddingRepository.countByStudentId(studentId);
      if (wipedSamples > 0) {
        await this.faceEmbeddingRepository.softRemoveByStudentId(studentId);
      }
    }

    await this.auditLogsService.create({
      eventType: consent
        ? AuditEventType.BIOMETRIC_CONSENT_GRANTED
        : AuditEventType.BIOMETRIC_CONSENT_REVOKED,
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      userRole: actor.userRole ?? null,
      resource: 'student',
      resourceId: String(studentId),
      ipAddress: actor.ipAddress ?? null,
      userAgent: actor.userAgent ?? null,
      details: {
        studentId,
        studentCode: student.studentId,
        previousConsent: student.biometricConsent ?? false,
        note: note ?? null,
        wipedSamples: consent ? undefined : wipedSamples,
      },
    });

    return {
      studentId,
      biometricConsent: updated?.biometricConsent ?? consent,
      biometricConsentAt: updated?.biometricConsentAt ?? now,
      biometricConsentBy: updated?.biometricConsentBy ?? actor.userId ?? null,
    };
  }
}
