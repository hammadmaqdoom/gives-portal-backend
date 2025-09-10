import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateParentDto } from './dto/create-parent.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterParentDto, SortParentDto } from './dto/query-parent.dto';
import { ParentRepository } from './infrastructure/persistence/parent.repository';
import { ParentStudentRepository } from './infrastructure/persistence/relational/repositories/parent-student.repository';
import { Parent } from './domain/parent';
import { UsersService } from '../users/users.service';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { User } from '../users/domain/user';
import { UpdateParentDto } from './dto/update-parent.dto';
import { StudentsService } from '../students/students.service';
import { randomStringGenerator } from '../utils/random-string-generator';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';

@Injectable()
export class ParentsService {
  constructor(
    private readonly parentsRepository: ParentRepository,
    private readonly parentStudentRepository: ParentStudentRepository,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => StudentsService))
    private readonly studentsService: StudentsService,
  ) {}

  async create(
    createParentDto: CreateParentDto,
  ): Promise<{ parent: Parent; user: any; tempPassword: string | null }> {
    console.log('ParentsService.create called with:', createParentDto);

    let user: User | undefined = undefined;
    let tempPassword: string | null = null;

    if (createParentDto.user?.id) {
      console.log('Using existing user ID:', createParentDto.user.id);
      const userObject = await this.usersService.findById(
        createParentDto.user.id,
      );
      if (!userObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'userNotExists',
          },
        });
      }
      user = userObject;
    } else if (createParentDto.email) {
      console.log(
        'Creating new user account for parent with email:',
        createParentDto.email,
      );
      // Create user account for parent if email is provided
      tempPassword = randomStringGenerator();
      const firstName =
        createParentDto.fullName.split(' ')[0] || createParentDto.fullName;
      const lastName =
        createParentDto.fullName.split(' ').slice(1).join(' ') || '';

      try {
        user = await this.usersService.create({
          email: createParentDto.email,
          password: tempPassword,
          firstName,
          lastName,
          role: { id: RoleEnum.user }, // Parents get user role
          status: { id: StatusEnum.active },
        });

        console.log(
          `Parent user account created: ${createParentDto.email} with role: ${user.role?.name}`,
        );
      } catch (error) {
        console.error('Error creating parent user account:', error);
        throw error;
      }
    }

    console.log('Creating parent record...');
    try {
      const parent = await this.parentsRepository.create({
        fullName: createParentDto.fullName,
        mobile: createParentDto.mobile,
        landline: createParentDto.landline,
        address: createParentDto.address,
        city: createParentDto.city,
        country: createParentDto.country,
        email: createParentDto.email,
        relationship: createParentDto.relationship,
        maritalStatus: createParentDto.maritalStatus,
        passcode: createParentDto.passcode,
        user,
      });

      console.log('Parent record created successfully:', parent);

      // Handle student relationships if provided
      if (createParentDto.students && createParentDto.students.length > 0) {
        console.log('Linking parent to students:', createParentDto.students);
        for (const studentDto of createParentDto.students) {
          if (studentDto.id) {
            try {
              await this.linkStudent(parent.id, studentDto.id);
              console.log(
                `Parent ${parent.id} linked to student ${studentDto.id}`,
              );
            } catch (error) {
              console.error(
                `Error linking parent ${parent.id} to student ${studentDto.id}:`,
                error,
              );
              // Don't throw here, just log the error and continue
            }
          }
        }
      }

      return { parent, user, tempPassword };
    } catch (error) {
      console.error('Error creating parent record:', error);
      throw error;
    }
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterParentDto | null;
    sortOptions?: SortParentDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Parent[]> {
    return this.parentsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Parent['id']): Promise<NullableType<Parent>> {
    return this.parentsRepository.findById(id);
  }

  findByEmail(email: Parent['email']): Promise<NullableType<Parent>> {
    return this.parentsRepository.findByEmail(email);
  }

  findByMobile(mobile: Parent['mobile']): Promise<NullableType<Parent>> {
    return this.parentsRepository.findByMobile(mobile);
  }

  findByUserId(userId: number): Promise<NullableType<Parent>> {
    return this.parentsRepository.findByUserId(userId);
  }

  async update(
    id: Parent['id'],
    updateParentDto: UpdateParentDto,
  ): Promise<Parent | null> {
    let user: User | undefined = undefined;

    if (updateParentDto.user?.id) {
      const userObject = await this.usersService.findById(
        updateParentDto.user.id,
      );
      if (!userObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'userNotExists',
          },
        });
      }
      user = userObject;
    }

    return this.parentsRepository.update(id, {
      fullName: updateParentDto.fullName,
      mobile: updateParentDto.mobile,
      landline: updateParentDto.landline,
      address: updateParentDto.address,
      city: updateParentDto.city,
      country: updateParentDto.country,
      email: updateParentDto.email,
      relationship: updateParentDto.relationship,
      maritalStatus: updateParentDto.maritalStatus,
      passcode: updateParentDto.passcode,
      user,
    });
  }

  async remove(id: Parent['id']): Promise<void> {
    await this.parentsRepository.remove(id);
  }

  // New methods for managing parent-student relationships
  async linkStudent(parentId: number, studentId: number): Promise<any> {
    // Check if parent exists
    const parent = await this.parentsRepository.findById(parentId);
    if (!parent) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          parent: 'parentNotExists',
        },
      });
    }

    // Check if student exists
    const student = await this.studentsService.findById(studentId);
    if (!student) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          student: 'studentNotExists',
        },
      });
    }

    // Check if relationship already exists
    const existingRelationship =
      await this.parentStudentRepository.findByParentAndStudent(
        parentId,
        studentId,
      );
    if (existingRelationship) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          relationship: 'relationshipAlreadyExists',
        },
      });
    }

    // Create relationship
    return this.parentStudentRepository.create({
      parentId,
      studentId,
      status: 'active',
    });
  }

  async unlinkStudent(parentId: number, studentId: number): Promise<void> {
    // Check if relationship exists
    const relationship =
      await this.parentStudentRepository.findByParentAndStudent(
        parentId,
        studentId,
      );
    if (!relationship) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          relationship: 'relationshipNotExists',
        },
      });
    }

    // Remove relationship
    await this.parentStudentRepository.removeByParentAndStudent(
      parentId,
      studentId,
    );
  }

  async getStudents(parentId: number): Promise<any[]> {
    // Check if parent exists
    const parent = await this.parentsRepository.findById(parentId);
    if (!parent) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          parent: 'parentNotExists',
        },
      });
    }

    // Get students with parent details
    return this.parentStudentRepository.findByParentId(parentId);
  }

  async findByStudentId(studentId: number): Promise<Parent[]> {
    const parentStudents = await this.parentStudentRepository.findByStudentId(studentId);
    const parents: Parent[] = [];
    
    for (const parentStudent of parentStudents) {
      const parent = await this.parentsRepository.findById(parentStudent.parentId);
      if (parent) {
        parents.push(parent);
      }
    }
    
    return parents;
  }
}
