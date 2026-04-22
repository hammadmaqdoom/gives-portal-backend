import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

// Hard cap per student to bound storage and matching cost.
const MAX_EMBEDDINGS_PER_STUDENT = 10;

@Injectable()
export class FaceEmbeddingsService {
  constructor(
    private readonly faceEmbeddingRepository: StudentFaceEmbeddingRepository,
    private readonly enrollmentRepository: StudentClassEnrollmentRepository,
    private readonly studentRepository: StudentRepository,
    private readonly filesService: FilesService,
  ) {}

  async create(
    studentId: number,
    dto: CreateFaceEmbeddingDto,
  ): Promise<StudentFaceEmbedding> {
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    const existingCount =
      await this.faceEmbeddingRepository.countByStudentId(studentId);
    if (existingCount >= MAX_EMBEDDINGS_PER_STUDENT) {
      throw new BadRequestException(
        `Student already has ${existingCount} face samples (max ${MAX_EMBEDDINGS_PER_STUDENT}). Delete one before adding more.`,
      );
    }

    return this.faceEmbeddingRepository.create({
      studentId,
      embedding: dto.embedding,
      modelName: dto.modelName,
      qualityScore: dto.qualityScore,
      sourceFileId: dto.sourceFileId,
    });
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

  async remove(studentId: number, embeddingId: number): Promise<void> {
    const existing = await this.faceEmbeddingRepository.findById(embeddingId);
    if (!existing || existing.studentId !== studentId) {
      throw new NotFoundException(
        `Face embedding ${embeddingId} not found for student ${studentId}`,
      );
    }
    await this.faceEmbeddingRepository.softRemove(embeddingId);
  }

  async removeAllForStudent(studentId: number): Promise<void> {
    await this.faceEmbeddingRepository.softRemoveByStudentId(studentId);
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
        };
      }),
    );

    return { classId, students: studentEntries };
  }
}
