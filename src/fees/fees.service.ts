import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateFeeDto } from './dto/create-fee.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterFeeDto, SortFeeDto } from './dto/query-fee.dto';
import { FeeRepository } from './infrastructure/persistence/fee.repository';
import { Fee, PaymentStatus } from './domain/fee';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateFeeDto } from './dto/update-fee.dto';
import { ParentsService } from '../parents/parents.service';
import { StudentsService } from '../students/students.service';

@Injectable()
export class FeesService {
  constructor(
    private readonly feeRepository: FeeRepository,
    @Inject(forwardRef(() => ParentsService))
    private readonly parentsService: ParentsService,
    @Inject(forwardRef(() => StudentsService))
    private readonly studentsService: StudentsService,
  ) {}

  async create(createFeeDto: CreateFeeDto): Promise<Fee> {
    // Transform DTO to domain format
    const feeData: Partial<Fee> = {
      amount: createFeeDto.amount,
      status: createFeeDto.status,
      paymentMethod: createFeeDto.paymentMethod,
      transactionId: createFeeDto.transactionId,
      dueDate: createFeeDto.dueDate,
      paidAt: createFeeDto.paidAt,
      description: createFeeDto.description,
      student: createFeeDto.student as any,
      class: createFeeDto.class as any,
    };

    return this.feeRepository.create(feeData);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterFeeDto | null;
    sortOptions?: SortFeeDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Fee[]> {
    return this.feeRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Fee['id']): Promise<NullableType<Fee>> {
    return this.feeRepository.findById(id);
  }

  async findByStudent(studentId: number): Promise<Fee[]> {
    return this.feeRepository.findByStudent(studentId);
  }

  async findByClass(classId: number): Promise<Fee[]> {
    return this.feeRepository.findByClass(classId);
  }

  async findByStudentAndClass(
    studentId: number,
    classId: number,
  ): Promise<Fee[]> {
    return this.feeRepository.findByStudentAndClass(studentId, classId);
  }

  async findOverdueFees(): Promise<Fee[]> {
    return this.feeRepository.findOverdueFees();
  }

  async update(id: Fee['id'], updateFeeDto: UpdateFeeDto): Promise<Fee | null> {
    // Transform DTO to domain format
    const feeData: Partial<Fee> = {
      ...updateFeeDto,
      student: updateFeeDto.student as any,
      class: updateFeeDto.class as any,
    };

    return this.feeRepository.update(id, feeData);
  }

  async markAsPaid(
    id: Fee['id'],
    paymentMethod: string,
    transactionId?: string,
  ): Promise<Fee | null> {
    const feeData: Partial<Fee> = {
      status: PaymentStatus.PAID,
      paymentMethod: paymentMethod as any,
      transactionId,
      paidAt: new Date(),
    };

    return this.feeRepository.update(id, feeData);
  }

  async remove(id: Fee['id']): Promise<void> {
    await this.feeRepository.remove(id);
  }

  // Helper method to check if user is a parent
  async isUserParent(userId: number): Promise<boolean> {
    try {
      if (!userId || isNaN(userId)) {
        return false;
      }
      const parent = await this.parentsService.findByUserId(userId);
      return !!parent;
    } catch {
      return false;
    }
  }

  // Helper method to check if user is a student
  async isUserStudent(userId: number): Promise<boolean> {
    try {
      if (!userId || isNaN(userId)) {
        return false;
      }
      const student = await this.studentsService.findByUserId(userId);
      return !!student;
    } catch {
      return false;
    }
  }

  // Get fees for a parent's children
  async getFeesForParent(userId: number): Promise<Fee[]> {
    try {
      console.log('getFeesForParent called with userId:', userId);

      if (!userId || isNaN(userId)) {
        console.log('Invalid userId in getFeesForParent');
        return [];
      }

      const parent = await this.parentsService.findByUserId(userId);
      if (!parent) {
        console.log('No parent found for userId:', userId);
        return [];
      }

      console.log('Found parent:', parent.id);

      // Get all students linked to this parent
      const parentStudents = await this.parentsService.getStudents(parent.id);
      console.log('Parent students:', parentStudents);

      const studentIds = parentStudents
        .map((ps) => ps.studentId)
        .filter((id) => id && !isNaN(id));
      console.log('Valid student IDs:', studentIds);

      // Get fees for all children
      const allFees: Fee[] = [];
      for (const studentId of studentIds) {
        console.log('Getting fees for student ID:', studentId);
        const studentFees = await this.feeRepository.findByStudent(studentId);
        allFees.push(...studentFees);
      }

      return allFees;
    } catch (error) {
      console.error('Error getting fees for parent:', error);
      return [];
    }
  }

  // Get fees for a student
  async getFeesForStudent(userId: number): Promise<Fee[]> {
    try {
      console.log('getFeesForStudent called with userId:', userId);

      if (!userId || isNaN(userId)) {
        console.log('Invalid userId in getFeesForStudent');
        return [];
      }

      const student = await this.studentsService.findByUserId(userId);
      if (!student) {
        console.log('No student found for userId:', userId);
        return [];
      }

      console.log('Found student:', student.id);
      return this.feeRepository.findByStudent(student.id);
    } catch (error) {
      console.error('Error getting fees for student:', error);
      return [];
    }
  }
}
