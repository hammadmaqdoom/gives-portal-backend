import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterAssignmentDto,
  SortAssignmentDto,
} from './dto/query-assignment.dto';
import { AssignmentRepository } from './infrastructure/persistence/assignment.repository';
import { Assignment, AssignmentStatus } from './domain/assignment';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private readonly assignmentsRepository: AssignmentRepository) {}

  async create(
    createAssignmentDto: CreateAssignmentDto,
    user?: any,
  ): Promise<Assignment> {
    // Transform DTO to domain format
    const assignmentData: Partial<Assignment> = {
      title: createAssignmentDto.title,
      description: createAssignmentDto.description,
      dueDate: createAssignmentDto.dueDate,
      type: createAssignmentDto.type,
      status: AssignmentStatus.DRAFT, // Default to draft
      maxScore: createAssignmentDto.maxScore,
      markingCriteria: createAssignmentDto.markingCriteria,
      attachments:
        createAssignmentDto.attachments &&
        createAssignmentDto.attachments.length > 0
          ? createAssignmentDto.attachments.filter(
              (att) => att && att.trim() !== '',
            )
          : undefined,
      class: { id: createAssignmentDto.class } as any, // ensure class_id persists
      teacher: user?.id ? ({ id: user.id } as any) : undefined,
    };

    return this.assignmentsRepository.create(assignmentData);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterAssignmentDto | null;
    sortOptions?: SortAssignmentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Assignment[]> {
    return this.assignmentsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Assignment['id']): Promise<NullableType<Assignment>> {
    return this.assignmentsRepository.findById(id);
  }

  async findByClass(classId: number): Promise<Assignment[]> {
    return this.assignmentsRepository.findByClass(classId);
  }

  async update(
    id: Assignment['id'],
    updateAssignmentDto: UpdateAssignmentDto,
  ): Promise<Assignment | null> {
    // Transform DTO to domain format
    const { class: classId, attachments, ...otherFields } = updateAssignmentDto;

    const assignmentData: Partial<Assignment> = {
      ...otherFields,
      attachments: attachments || [],
    };

    // Only transform class field if it's being updated
    if (classId !== undefined) {
      assignmentData.class = { id: classId } as any;
    }

    return this.assignmentsRepository.update(id, assignmentData);
  }

  async remove(id: Assignment['id']): Promise<void> {
    await this.assignmentsRepository.remove(id);
  }
}
