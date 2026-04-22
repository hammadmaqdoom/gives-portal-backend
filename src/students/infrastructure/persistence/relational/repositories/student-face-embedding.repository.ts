import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { StudentFaceEmbeddingEntity } from '../entities/student-face-embedding.entity';
import { StudentFaceEmbedding } from '../../../../domain/student-face-embedding';
import { StudentFaceEmbeddingMapper } from '../mappers/student-face-embedding.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class StudentFaceEmbeddingRepository {
  constructor(
    @InjectRepository(StudentFaceEmbeddingEntity)
    private readonly repo: Repository<StudentFaceEmbeddingEntity>,
    private readonly mapper: StudentFaceEmbeddingMapper,
  ) {}

  async create(
    data: Partial<StudentFaceEmbedding>,
  ): Promise<StudentFaceEmbedding> {
    const entity = this.mapper.toPersistence(data);
    const saved = await this.repo.save(this.repo.create(entity));
    return this.mapper.toDomain(saved);
  }

  async findById(id: number): Promise<NullableType<StudentFaceEmbedding>> {
    const found = await this.repo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    return found ? this.mapper.toDomain(found) : null;
  }

  async findByStudentId(studentId: number): Promise<StudentFaceEmbedding[]> {
    const rows = await this.repo.find({
      where: { studentId, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
    return rows.map((r) => this.mapper.toDomain(r));
  }

  async findByStudentIds(
    studentIds: number[],
  ): Promise<StudentFaceEmbedding[]> {
    if (studentIds.length === 0) return [];
    const rows = await this.repo
      .createQueryBuilder('fe')
      .where('fe.studentId IN (:...studentIds)', { studentIds })
      .andWhere('fe.deletedAt IS NULL')
      .orderBy('fe.studentId', 'ASC')
      .addOrderBy('fe.createdAt', 'ASC')
      .getMany();
    return rows.map((r) => this.mapper.toDomain(r));
  }

  async countByStudentId(studentId: number): Promise<number> {
    return this.repo.count({ where: { studentId, deletedAt: IsNull() } });
  }

  async softRemove(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }

  async softRemoveByStudentId(studentId: number): Promise<void> {
    await this.repo.softDelete({ studentId });
  }
}
