import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { SubmissionRepository } from './infrastructure/persistence/submission.repository';
import { Submission, SubmissionStatus } from './domain/submission';
import { NullableType } from '../utils/types/nullable.type';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class SubmissionsService {
  constructor(private readonly submissionsRepository: SubmissionRepository) {}

  async create(createSubmissionDto: CreateSubmissionDto): Promise<Submission> {
    // Check if submission already exists for this student and assignment
    const existingSubmission =
      await this.submissionsRepository.findByStudentAndAssignment(
        createSubmissionDto.student,
        createSubmissionDto.assignment,
      );

    if (existingSubmission) {
      throw new BadRequestException(
        'Submission already exists for this student and assignment',
      );
    }

    // Transform DTO to domain format
    const submissionData: Partial<Submission> = {
      status: createSubmissionDto.status || SubmissionStatus.PENDING,
      score: createSubmissionDto.score,
      grade: createSubmissionDto.grade,
      comments: createSubmissionDto.comments,
      fileUrl: createSubmissionDto.fileUrl,
      attachments:
        createSubmissionDto.attachments &&
        createSubmissionDto.attachments.length > 0
          ? createSubmissionDto.attachments.filter(
              (att) => att && att.trim() !== '',
            )
          : undefined,
      submittedAt:
        createSubmissionDto.status === SubmissionStatus.SUBMITTED
          ? new Date()
          : null,
      student: { id: createSubmissionDto.student } as any,
      assignment: { id: createSubmissionDto.assignment } as any,
    };

    // console.log('Creating submission with data:', submissionData);
    const result = await this.submissionsRepository.create(submissionData);
    // console.log('Created submission result:', result);
    return result;
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
    return this.submissionsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Submission['id']): Promise<NullableType<Submission>> {
    return this.submissionsRepository.findById(id);
  }

  async findByAssignment(assignmentId: number): Promise<Submission[]> {
    return this.submissionsRepository.findByAssignment(assignmentId);
  }

  async findByStudent(studentId: number): Promise<Submission[]> {
    return this.submissionsRepository.findByStudent(studentId);
  }

  async findByStudentAndAssignment(
    studentId: number,
    assignmentId: number,
  ): Promise<NullableType<Submission>> {
    return this.submissionsRepository.findByStudentAndAssignment(
      studentId,
      assignmentId,
    );
  }

  async update(
    id: Submission['id'],
    updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<Submission | null> {
    const submission = await this.submissionsRepository.findById(id);
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Transform DTO to domain format
    const submissionData: Partial<Submission> = {
      ...updateSubmissionDto,
      attachments:
        updateSubmissionDto.attachments &&
        updateSubmissionDto.attachments.length > 0
          ? updateSubmissionDto.attachments.filter(
              (att) => att && att.trim() !== '',
            )
          : undefined,
      student: updateSubmissionDto.student
        ? ({ id: updateSubmissionDto.student } as any)
        : undefined,
      assignment: updateSubmissionDto.assignment
        ? ({ id: updateSubmissionDto.assignment } as any)
        : undefined,
    };

    // Update submittedAt if status is being changed to SUBMITTED
    if (
      updateSubmissionDto.status === SubmissionStatus.SUBMITTED &&
      submission.status !== SubmissionStatus.SUBMITTED
    ) {
      submissionData.submittedAt = new Date();
    }

    // Update gradedAt if score or grade is being set
    if (
      (updateSubmissionDto.score !== undefined ||
        updateSubmissionDto.grade !== undefined) &&
      !submission.gradedAt
    ) {
      submissionData.gradedAt = new Date();
    }

    return this.submissionsRepository.update(id, submissionData);
  }

  async remove(id: Submission['id']): Promise<void> {
    const submission = await this.submissionsRepository.findById(id);
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    await this.submissionsRepository.remove(id);
  }

  async gradeSubmission(
    id: Submission['id'],
    score: number,
    grade: string,
    comments?: string,
  ): Promise<Submission | null> {
    const submission = await this.submissionsRepository.findById(id);
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const submissionData: Partial<Submission> = {
      score,
      grade,
      comments,
      status: SubmissionStatus.GRADED,
      gradedAt: new Date(),
    };

    return this.submissionsRepository.update(id, submissionData);
  }
}
