import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  Inject,
  forwardRef,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { performBulkDelete } from '../utils/dto/bulk-delete.dto';
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
import { MailService } from '../mail/mail.service';
import { randomStringGenerator } from '../utils/random-string-generator';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';

@Injectable()
export class ParentsService {
  private readonly logger = new Logger(ParentsService.name);

  constructor(
    private readonly parentsRepository: ParentRepository,
    private readonly parentStudentRepository: ParentStudentRepository,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => StudentsService))
    private readonly studentsService: StudentsService,
    private readonly mailService: MailService,
  ) {}

  async create(
    createParentDto: CreateParentDto,
  ): Promise<{ parent: Parent; user: any; tempPassword: string | null }> {
    this.logger.debug(
      `create email=${createParentDto.email ?? '-'} fullName=${createParentDto.fullName}`,
    );

    let user: User | undefined = undefined;
    let tempPassword: string | null = null;

    if (createParentDto.user?.id) {
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
          role: { id: RoleEnum.user },
          status: { id: StatusEnum.active },
        });

        this.logger.log(
          `Parent user account created email=${createParentDto.email} role=${user.role?.name}`,
        );

        try {
          await this.mailService.sendAccountCredentials({
            to: createParentDto.email,
            userName: createParentDto.fullName,
            email: createParentDto.email,
            tempPassword,
            isParent: true,
          });
          this.logger.log(
            `Account credentials email sent to parent=${createParentDto.email}`,
          );
        } catch (emailError) {
          this.logger.error(
            `Failed to send account credentials email to parent ${createParentDto.email}: ${(emailError as Error).message}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error creating parent user account: ${(error as Error).message}`,
        );
        throw error;
      }
    }

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

      this.logger.log(`Parent record created id=${parent.id}`);

      if (createParentDto.students && createParentDto.students.length > 0) {
        for (const studentDto of createParentDto.students) {
          if (studentDto.id) {
            try {
              await this.linkStudent(parent.id, studentDto.id);
              this.logger.debug(
                `Parent ${parent.id} linked to student ${studentDto.id}`,
              );
            } catch (error) {
              this.logger.error(
                `Error linking parent ${parent.id} to student ${studentDto.id}: ${(error as Error).message}`,
              );
            }
          }
        }
      }

      return { parent, user, tempPassword };
    } catch (error) {
      this.logger.error(
        `Error creating parent record: ${(error as Error).message}`,
      );
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

  async bulkRemove(ids: Array<Parent['id']>) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No parent ids provided');
    }
    return performBulkDelete(ids, (id) => this.parentsRepository.remove(id));
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
    const parentStudents =
      await this.parentStudentRepository.findByStudentId(studentId);
    const parents: Parent[] = [];

    for (const parentStudent of parentStudents) {
      const parent = await this.parentsRepository.findById(
        parentStudent.parentId,
      );
      if (parent) {
        parents.push(parent);
      }
    }

    return parents;
  }
}
