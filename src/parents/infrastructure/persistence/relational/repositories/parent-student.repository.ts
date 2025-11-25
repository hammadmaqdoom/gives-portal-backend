import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentStudentEntity } from '../entities/parent-student.entity';
import { ParentStudent } from '../../../../domain/parent-student';
import { ParentStudentMapper } from '../mappers/parent-student.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class ParentStudentRepository {
  constructor(
    @InjectRepository(ParentStudentEntity)
    private readonly parentStudentRepository: Repository<ParentStudentEntity>,
    private readonly parentStudentMapper: ParentStudentMapper,
  ) {}

  async create(data: Partial<ParentStudent>): Promise<ParentStudent> {
    const parentStudentEntity = this.parentStudentMapper.toPersistence(data);
    const newParentStudent = await this.parentStudentRepository.save(
      this.parentStudentRepository.create(parentStudentEntity),
    );

    return this.parentStudentMapper.toDomain(newParentStudent);
  }

  async findById(id: number): Promise<NullableType<ParentStudent>> {
    const parentStudent = await this.parentStudentRepository.findOne({
      where: { id },
      relations: ['parent', 'student'],
    });

    return parentStudent
      ? this.parentStudentMapper.toDomain(parentStudent)
      : null;
  }

  async findByParentId(parentId: number): Promise<ParentStudent[]> {
    const parentStudents = await this.parentStudentRepository.find({
      where: { parentId },
      relations: ['parent', 'student'],
    });

    return parentStudents.map((parentStudent) =>
      this.parentStudentMapper.toDomain(parentStudent),
    );
  }

  async findByStudentId(studentId: number): Promise<ParentStudent[]> {
    const parentStudents = await this.parentStudentRepository.find({
      where: { studentId },
      relations: ['parent', 'student'],
    });

    return parentStudents.map((parentStudent) =>
      this.parentStudentMapper.toDomain(parentStudent),
    );
  }

  async findByParentAndStudent(
    parentId: number,
    studentId: number,
  ): Promise<NullableType<ParentStudent>> {
    const parentStudent = await this.parentStudentRepository.findOne({
      where: { parentId, studentId },
      relations: ['parent', 'student'],
    });

    return parentStudent
      ? this.parentStudentMapper.toDomain(parentStudent)
      : null;
  }

  async findActiveByParentId(parentId: number): Promise<ParentStudent[]> {
    const parentStudents = await this.parentStudentRepository.find({
      where: { parentId, status: 'active' },
      relations: ['parent', 'student'],
    });

    return parentStudents.map((parentStudent) =>
      this.parentStudentMapper.toDomain(parentStudent),
    );
  }

  async update(
    id: number,
    data: Partial<ParentStudent>,
  ): Promise<ParentStudent | null> {
    const parentStudent = await this.parentStudentRepository.findOne({
      where: { id },
    });

    if (!parentStudent) {
      return null;
    }

    const parentStudentEntity = this.parentStudentMapper.toPersistence(data);
    const updatedParentStudent = await this.parentStudentRepository.save({
      ...parentStudent,
      ...parentStudentEntity,
    });

    return this.parentStudentMapper.toDomain(updatedParentStudent);
  }

  async remove(id: number): Promise<void> {
    await this.parentStudentRepository.softDelete(id);
  }

  async removeByParentAndStudent(
    parentId: number,
    studentId: number,
  ): Promise<void> {
    await this.parentStudentRepository.softDelete({ parentId, studentId });
  }
}
