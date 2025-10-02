import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';
import { Student } from '../../../../domain/student';
import { StudentMapper } from '../mappers/student.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import {
  FilterStudentDto,
  SortStudentDto,
} from '../../../../dto/query-student.dto';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class StudentsRelationalRepository {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly studentsRepository: Repository<StudentEntity>,
    private readonly studentMapper: StudentMapper,
  ) {}

  async create(data: Partial<Student>): Promise<Student> {
    const studentEntity = this.studentMapper.toPersistence(data);
    const newStudent = await this.studentsRepository.save(
      this.studentsRepository.create(studentEntity),
    );

    return this.studentMapper.toDomain(newStudent);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
    includeRelations = true,
  }: {
    filterOptions?: FilterStudentDto | null;
    sortOptions?: SortStudentDto[] | null;
    paginationOptions: IPaginationOptions;
    includeRelations?: boolean;
  }): Promise<Student[]> {
    const queryBuilder = this.studentsRepository.createQueryBuilder('student');

    // Add basic joins only if needed
    if (includeRelations) {
      queryBuilder
        .leftJoinAndSelect('student.photo', 'photo')
        .leftJoinAndSelect('student.user', 'user');
    }

    // Add search filter
    if (filterOptions?.search) {
      queryBuilder.andWhere(
        '(student.name ILIKE :search OR student.studentId ILIKE :search OR student.email ILIKE :search)',
        { search: `%${filterOptions.search}%` },
      );
    }

    // Add city filter
    if (filterOptions?.city) {
      queryBuilder.andWhere('student.city = :city', {
        city: filterOptions.city,
      });
    }

    // Add country filter
    if (filterOptions?.country) {
      queryBuilder.andWhere('student.country = :country', {
        country: filterOptions.country,
      });
    }

    // Add sorting
    if (sortOptions && sortOptions.length > 0) {
      sortOptions.forEach((sort) => {
        if (sort.key && sort.order) {
          queryBuilder.addOrderBy(`student.${sort.key}`, sort.order);
        }
      });
    } else {
      queryBuilder.addOrderBy('student.createdAt', 'DESC');
    }

    // Add pagination
    const { page, limit } = paginationOptions;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    try {
      const students = await queryBuilder.getMany();
      return students.map((student) => this.studentMapper.toDomain(student));
    } catch (error) {
      console.error('Error in findManyWithPagination:', error);
      // Fallback to simple query if complex query fails
      const fallbackQuery = this.studentsRepository
        .createQueryBuilder('student')
        .orderBy('student.createdAt', 'DESC')
        .skip(skip)
        .take(limit);

      const students = await fallbackQuery.getMany();
      return students.map((student) => this.studentMapper.toDomain(student));
    }
  }

  async findById(id: Student['id']): Promise<NullableType<Student>> {
    const student = await this.studentsRepository.findOne({
      where: { id },
      relations: [
        'photo',
        'user',
        'classEnrollments',
        'classEnrollments.class',
        'parentStudents',
        'parentStudents.parent',
      ],
    });

    return student ? this.studentMapper.toDomain(student) : null;
  }

  async findByUserId(userId: number): Promise<NullableType<Student>> {
    console.log(
      `🔍 StudentRepository.findByUserId called with userId: ${userId}`,
    );

    const student = await this.studentsRepository.findOne({
      where: { userId: userId },
      relations: [
        'photo',
        'user',
        'classEnrollments',
        'classEnrollments.class',
        'parentStudents',
        'parentStudents.parent',
      ],
    });

    console.log(`🔍 StudentRepository.findByUserId raw result:`, student);
    console.log(
      `🔍 StudentRepository.findByUserId raw result userId:`,
      student?.userId,
    );

    const result = student ? this.studentMapper.toDomain(student) : null;
    console.log(`🔍 StudentRepository.findByUserId mapped result:`, result);
    console.log(
      `🔍 StudentRepository.findByUserId mapped result userId:`,
      result?.userId,
    );

    return result;
  }

  async findByEmail(email: string): Promise<NullableType<Student>> {
    console.log(`StudentRepository.findByEmail called with email: ${email}`);
    const student = await this.studentsRepository.findOne({
      where: [{ email: email }, { user: { email: email } }],
      relations: [
        'photo',
        'user',
        'classEnrollments',
        'classEnrollments.class',
        'parentStudents',
        'parentStudents.parent',
      ],
    });
    console.log(`StudentRepository.findByEmail raw result:`, student);
    const result = student ? this.studentMapper.toDomain(student) : null;
    console.log(`StudentRepository.findByEmail mapped result:`, result);
    return result;
  }

  async findByStudentId(
    studentId: Student['studentId'],
  ): Promise<NullableType<Student>> {
    const student = await this.studentsRepository.findOne({
      where: { studentId },
      relations: [
        'photo',
        'user',
        'classEnrollments',
        'classEnrollments.class',
        'parentStudents',
        'parentStudents.parent',
      ],
    });

    return student ? this.studentMapper.toDomain(student) : null;
  }

  async update(
    id: Student['id'],
    data: Partial<Student>,
  ): Promise<Student | null> {
    const student = await this.studentsRepository.findOne({
      where: { id },
    });

    if (!student) {
      return null;
    }

    const studentEntity = this.studentMapper.toPersistence(data);
    const updatedStudent = await this.studentsRepository.save({
      ...student,
      ...studentEntity,
    });

    return this.studentMapper.toDomain(updatedStudent);
  }

  async remove(id: Student['id']): Promise<void> {
    await this.studentsRepository.softDelete(id);
  }

  async generateStudentId(): Promise<string> {
    const lastStudent = await this.studentsRepository.findOne({
      where: {},
      order: { id: 'DESC' },
    });

    const nextId = lastStudent
      ? parseInt(lastStudent.studentId.split('-')[1]) + 1
      : 1;
    return `STD-${nextId.toString().padStart(4, '0')}`;
  }
}
