import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentClassEnrollmentEntity } from '../entities/student-class-enrollment.entity';
import { StudentClassEnrollment } from '../../../../domain/student-class-enrollment';
import { StudentClassEnrollmentMapper } from '../mappers/student-class-enrollment.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class StudentClassEnrollmentRepository {
  constructor(
    @InjectRepository(StudentClassEnrollmentEntity)
    private readonly enrollmentRepository: Repository<StudentClassEnrollmentEntity>,
    private readonly enrollmentMapper: StudentClassEnrollmentMapper,
  ) {}

  async create(
    data: Partial<StudentClassEnrollment>,
  ): Promise<StudentClassEnrollment> {
    const enrollmentEntity = this.enrollmentMapper.toPersistence(data);
    const newEnrollment = await this.enrollmentRepository.save(
      this.enrollmentRepository.create(enrollmentEntity),
    );

    return this.enrollmentMapper.toDomain(newEnrollment);
  }

  async findById(id: number): Promise<NullableType<StudentClassEnrollment>> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
      relations: ['student', 'class'],
    });

    return enrollment ? this.enrollmentMapper.toDomain(enrollment) : null;
  }

  async findByStudentId(studentId: number): Promise<StudentClassEnrollment[]> {
    const enrollments = await this.enrollmentRepository.find({
      where: { studentId },
      relations: ['student', 'class'],
    });

    return enrollments.map((enrollment) =>
      this.enrollmentMapper.toDomain(enrollment),
    );
  }

  async findByClassId(classId: number): Promise<StudentClassEnrollment[]> {
    const enrollments = await this.enrollmentRepository.find({
      where: { classId },
      relations: ['student', 'class'],
    });

    return enrollments.map((enrollment) =>
      this.enrollmentMapper.toDomain(enrollment),
    );
  }

  async findByStudentAndClass(
    studentId: number,
    classId: number,
  ): Promise<NullableType<StudentClassEnrollment>> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { studentId, classId },
      relations: ['student', 'class'],
    });

    return enrollment ? this.enrollmentMapper.toDomain(enrollment) : null;
  }

  async findActiveByStudentId(
    studentId: number,
  ): Promise<StudentClassEnrollment[]> {
    const enrollments = await this.enrollmentRepository.find({
      where: { studentId, status: 'active' },
      relations: ['student', 'class'],
    });

    return enrollments.map((enrollment) =>
      this.enrollmentMapper.toDomain(enrollment),
    );
  }

  async findEnrollmentHistoryByStudentId(
    studentId: number,
  ): Promise<StudentClassEnrollment[]> {
    const enrollments = await this.enrollmentRepository.find({
      where: { studentId },
      relations: ['student', 'class'],
      order: { enrollmentDate: 'DESC' },
    });

    return enrollments.map((enrollment) =>
      this.enrollmentMapper.toDomain(enrollment),
    );
  }

  async findEnrollmentHistoryByClassId(
    classId: number,
  ): Promise<StudentClassEnrollment[]> {
    const enrollments = await this.enrollmentRepository.find({
      where: { classId },
      relations: ['student', 'class'],
      order: { enrollmentDate: 'DESC' },
    });

    return enrollments.map((enrollment) =>
      this.enrollmentMapper.toDomain(enrollment),
    );
  }

  async update(
    id: number,
    data: Partial<StudentClassEnrollment>,
  ): Promise<StudentClassEnrollment | null> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
    });

    if (!enrollment) {
      return null;
    }

    const enrollmentEntity = this.enrollmentMapper.toPersistence(data);
    const updatedEnrollment = await this.enrollmentRepository.save({
      ...enrollment,
      ...enrollmentEntity,
    });

    return this.enrollmentMapper.toDomain(updatedEnrollment);
  }

  async remove(id: number): Promise<void> {
    await this.enrollmentRepository.update(id, {
      status: 'dropped',
      deenrollmentDate: new Date(),
    });
  }

  async removeByStudentAndClass(
    studentId: number,
    classId: number,
  ): Promise<void> {
    await this.enrollmentRepository.update(
      { studentId, classId },
      {
        status: 'dropped',
        deenrollmentDate: new Date(),
      },
    );
  }
}
