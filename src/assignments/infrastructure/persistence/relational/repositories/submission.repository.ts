import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmissionEntity } from '../entities/submission.entity';
import { Submission } from '../../../../domain/submission';
import { SubmissionMapper } from '../mappers/submission.mapper';
import { SubmissionRepository } from '../../submission.repository';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class SubmissionsRelationalRepository implements SubmissionRepository {
  constructor(
    @InjectRepository(SubmissionEntity)
    private readonly submissionsRepository: Repository<SubmissionEntity>,
    private readonly submissionMapper: SubmissionMapper,
  ) {}

  async create(data: Partial<Submission>): Promise<Submission> {
    console.log('Creating submission with data:', data);

    const submissionEntity = this.submissionMapper.toPersistence(data);
    console.log('Persistence entity:', submissionEntity);

    const newSubmission = await this.submissionsRepository.save(
      this.submissionsRepository.create(submissionEntity),
    );
    console.log('Saved submission entity:', newSubmission);

    const mappedSubmission = this.submissionMapper.toDomain(newSubmission);
    console.log('Final mapped submission:', mappedSubmission);

    return mappedSubmission;
  }

  async findById(id: Submission['id']): Promise<NullableType<Submission>> {
    const submission = await this.submissionsRepository.findOne({
      where: { id },
    });
    return submission ? this.submissionMapper.toDomain(submission) : null;
  }

  async findByAssignment(assignmentId: number): Promise<Submission[]> {
    const submissions = await this.submissionsRepository.find({
      where: { assignment: { id: assignmentId } },
    });
    return submissions.map((submission) =>
      this.submissionMapper.toDomain(submission),
    );
  }

  async findByStudent(studentId: number): Promise<Submission[]> {
    const submissions = await this.submissionsRepository.find({
      where: { student: { id: studentId } },
    });
    return submissions.map((submission) =>
      this.submissionMapper.toDomain(submission),
    );
  }

  async findByStudentAndAssignment(
    studentId: number,
    assignmentId: number,
  ): Promise<NullableType<Submission>> {
    const submission = await this.submissionsRepository.findOne({
      where: {
        student: { id: studentId },
        assignment: { id: assignmentId },
      },
    });
    return submission ? this.submissionMapper.toDomain(submission) : null;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: any | null;
    sortOptions?: any[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Submission[]> {
    const queryBuilder = this.submissionsRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.student', 'student')
      .leftJoinAndSelect('submission.assignment', 'assignment');

    if (filterOptions?.assignmentId) {
      queryBuilder.andWhere('assignment.id = :assignmentId', {
        assignmentId: filterOptions.assignmentId,
      });
    }

    if (filterOptions?.studentId) {
      queryBuilder.andWhere('student.id = :studentId', {
        studentId: filterOptions.studentId,
      });
    }

    if (filterOptions?.status) {
      queryBuilder.andWhere('submission.status = :status', {
        status: filterOptions.status,
      });
    }

    if (sortOptions?.length) {
      sortOptions.forEach((sortOption) => {
        queryBuilder.addOrderBy(
          `submission.${sortOption.orderBy}`,
          sortOption.order.toUpperCase() as 'ASC' | 'DESC',
        );
      });
    } else {
      queryBuilder.addOrderBy('submission.createdAt', 'DESC');
    }

    console.log('Submission query SQL:', queryBuilder.getSql());
    console.log('Submission query parameters:', queryBuilder.getParameters());

    queryBuilder.skip((paginationOptions.page - 1) * paginationOptions.limit);
    queryBuilder.take(paginationOptions.limit);

    const submissions = await queryBuilder.getMany();
    console.log('Raw submissions from database:', submissions);

    const mappedSubmissions = submissions.map((submission) =>
      this.submissionMapper.toDomain(submission),
    );

    console.log('Mapped submissions:', mappedSubmissions);
    return mappedSubmissions;
  }

  async update(
    id: Submission['id'],
    data: Partial<Submission>,
  ): Promise<Submission | null> {
    const submission = await this.submissionsRepository.findOne({
      where: { id },
    });

    if (!submission) {
      return null;
    }

    const submissionEntity = this.submissionMapper.toPersistence(data);
    const updatedSubmission = await this.submissionsRepository.save({
      ...submission,
      ...submissionEntity,
    });

    return this.submissionMapper.toDomain(updatedSubmission);
  }

  async remove(id: Submission['id']): Promise<void> {
    await this.submissionsRepository.softDelete(id);
  }
}
