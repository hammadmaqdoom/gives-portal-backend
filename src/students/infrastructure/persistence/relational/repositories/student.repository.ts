import { Injectable, Logger } from '@nestjs/common';
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
import { normalizePagination } from '../../../../../utils/normalize-pagination';

@Injectable()
export class StudentsRelationalRepository {
  private readonly logger = new Logger(StudentsRelationalRepository.name);

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

    // Add pagination (server-side clamped to MAX_PAGINATION_LIMIT)
    const { skip, take, page, limit } = normalizePagination(paginationOptions);
    queryBuilder.skip(skip).take(take);

    try {
      const students = await queryBuilder.getMany();
      this.logger.debug(
        `findManyWithPagination page=${page} limit=${limit} -> ${students.length} rows`,
      );
      return students.map((student) => this.studentMapper.toDomain(student));
    } catch (error) {
      this.logger.error(
        `findManyWithPagination failed: ${(error as Error).message}`,
      );
      // Fallback to simple query if complex query fails
      const fallbackQuery = this.studentsRepository
        .createQueryBuilder('student')
        .orderBy('student.createdAt', 'DESC')
        .skip(skip)
        .take(take);

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

    this.logger.debug(
      `findByUserId userId=${userId} -> ${student ? `id=${student.id}` : 'not found'}`,
    );

    return student ? this.studentMapper.toDomain(student) : null;
  }

  async findByEmail(email: string): Promise<NullableType<Student>> {
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
    this.logger.debug(
      `findByEmail email=${email} -> ${student ? `id=${student.id}` : 'not found'}`,
    );
    return student ? this.studentMapper.toDomain(student) : null;
  }

  async findByContact(contact: string): Promise<NullableType<Student>> {
    if (!contact || contact.trim() === '') {
      return null;
    }
    
    const trimmedContact = contact.trim();
    
    // Try exact match first
    let student = await this.studentsRepository.findOne({
      where: { contact: trimmedContact },
      relations: [
        'photo',
        'user',
        'classEnrollments',
        'classEnrollments.class',
        'parentStudents',
        'parentStudents.parent',
      ],
    });

    // If not found, try matching without common phone formatting characters
    if (!student) {
      // Normalize phone number - remove spaces, dashes, parentheses
      const normalizedContact = trimmedContact.replace(/[\s\-\(\)]/g, '');
      
      // Use LIKE query to find potential matches
      student = await this.studentsRepository
        .createQueryBuilder('student')
        .leftJoinAndSelect('student.photo', 'photo')
        .leftJoinAndSelect('student.user', 'user')
        .leftJoinAndSelect('student.classEnrollments', 'classEnrollments')
        .leftJoinAndSelect('classEnrollments.class', 'class')
        .leftJoinAndSelect('student.parentStudents', 'parentStudents')
        .leftJoinAndSelect('parentStudents.parent', 'parent')
        .where('REPLACE(REPLACE(REPLACE(REPLACE(student.contact, \' \', \'\'), \'-\', \'\'), \'(\', \'\'), \')\', \'\') = :normalizedContact', { normalizedContact })
        .getOne();
    }

    return student ? this.studentMapper.toDomain(student) : null;
  }

  async findByEmailOrContact(email?: string, contact?: string): Promise<NullableType<Student>> {
    // Check by email first if provided
    if (email && email.trim() !== '') {
      const studentByEmail = await this.findByEmail(email.trim());
      if (studentByEmail) {
        return studentByEmail;
      }
    }
    
    // Then check by contact/phone if provided
    if (contact && contact.trim() !== '') {
      const studentByContact = await this.findByContact(contact.trim());
      if (studentByContact) {
        return studentByContact;
      }
    }
    
    return null;
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
