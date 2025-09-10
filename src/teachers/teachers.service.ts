import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterTeacherDto, SortTeacherDto } from './dto/query-teacher.dto';
import { TeacherRepository } from './infrastructure/persistence/teacher.repository';
import { Teacher } from './domain/teacher';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { UsersService } from '../users/users.service';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { randomStringGenerator } from '../utils/random-string-generator';

@Injectable()
export class TeachersService {
  constructor(
    private readonly teachersRepository: TeacherRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createTeacherDto: CreateTeacherDto,
  ): Promise<{ teacher: Teacher; user: any; tempPassword: string | null }> {
    if (createTeacherDto.email) {
      const existingTeacher = await this.teachersRepository.findByEmail(
        createTeacherDto.email,
      );
      if (existingTeacher) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'teacherEmailAlreadyExists',
          },
        });
      }
    }

    if (createTeacherDto.phone) {
      const existingTeacher = await this.teachersRepository.findByPhone(
        createTeacherDto.phone,
      );
      if (existingTeacher) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            phone: 'teacherPhoneAlreadyExists',
          },
        });
      }
    }

    // Create teacher first
    const teacher = await this.teachersRepository.create(createTeacherDto);

    // Only create user account if teacher has an email
    let user: any = null;
    let tempPassword: string | null = null;

    if (createTeacherDto.email) {
      // Generate temporary password
      tempPassword = randomStringGenerator();

      // Create user account for teacher
      user = await this.usersService.create({
        email: createTeacherDto.email,
        password: tempPassword,
        firstName: createTeacherDto.name.split(' ')[0] || createTeacherDto.name,
        lastName: createTeacherDto.name.split(' ').slice(1).join(' ') || '',
        role: { id: RoleEnum.teacher },
        status: { id: StatusEnum.active },
      });

      console.log(
        `Teacher user account created: ${user.email} with role: ${user.role?.name}`,
      );
    } else {
      console.log(
        `Teacher created without email - no user account created for: ${createTeacherDto.name}`,
      );
    }

    return { teacher, user, tempPassword };
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTeacherDto | null;
    sortOptions?: SortTeacherDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Teacher[]> {
    return this.teachersRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Teacher['id']): Promise<NullableType<Teacher>> {
    return this.teachersRepository.findById(id);
  }

  async findByEmail(email: Teacher['email']): Promise<NullableType<Teacher>> {
    return this.teachersRepository.findByEmail(email);
  }

  async findByPhone(phone: Teacher['phone']): Promise<NullableType<Teacher>> {
    return this.teachersRepository.findByPhone(phone);
  }

  async update(
    id: Teacher['id'],
    updateTeacherDto: UpdateTeacherDto,
  ): Promise<{
    teacher: Teacher | null;
    tempPassword?: string;
    userAccountCreated: boolean;
  }> {
    // Get current teacher data
    const currentTeacher = await this.teachersRepository.findById(id);
    if (!currentTeacher) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          teacher: 'teacherNotFound',
        },
      });
    }

    if (updateTeacherDto.email) {
      const existingTeacher = await this.teachersRepository.findByEmail(
        updateTeacherDto.email,
      );
      if (existingTeacher && existingTeacher.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'teacherEmailAlreadyExists',
          },
        });
      }
    }

    if (updateTeacherDto.phone) {
      const existingTeacher = await this.teachersRepository.findByPhone(
        updateTeacherDto.phone,
      );
      if (existingTeacher && existingTeacher.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            phone: 'teacherPhoneAlreadyExists',
          },
        });
      }
    }

    // Update teacher record
    const updatedTeacher = await this.teachersRepository.update(
      id,
      updateTeacherDto,
    );

    // Handle user account creation/update
    let tempPassword: string | undefined;
    let userAccountCreated = false;

    if (updateTeacherDto.email) {
      const teacherName = updateTeacherDto.name || currentTeacher.name;
      const firstName = teacherName.split(' ')[0] || teacherName;
      const lastName = teacherName.split(' ').slice(1).join(' ') || '';

      // Check if user account exists for this email
      const existingUser = await this.usersService.findByEmail(
        updateTeacherDto.email,
      );

      if (existingUser) {
        // Update existing user account with teacher role if needed
        if (existingUser.role?.id !== RoleEnum.teacher) {
          await this.usersService.update(existingUser.id, {
            role: { id: RoleEnum.teacher },
            firstName,
            lastName,
          });
          console.log(
            `Teacher update: ${updateTeacherDto.email} - user account role updated to teacher`,
          );
        } else {
          // Update name if changed
          await this.usersService.update(existingUser.id, {
            firstName,
            lastName,
          });
          console.log(
            `Teacher update: ${updateTeacherDto.email} - user account name updated`,
          );
        }
      } else {
        // Create new user account
        tempPassword = randomStringGenerator();
        userAccountCreated = true;
        await this.usersService.create({
          email: updateTeacherDto.email,
          password: tempPassword,
          firstName,
          lastName,
          role: { id: RoleEnum.teacher },
          status: { id: StatusEnum.active },
        });
        console.log(
          `Teacher update: ${updateTeacherDto.email} - new user account created with temp password`,
        );
      }
    } else if (currentTeacher.email && !updateTeacherDto.email) {
      // Email was removed - we could optionally disable the user account
      // For now, we'll just log this case
      console.log(
        `Teacher update: email removed for teacher ${currentTeacher.name} - user account remains active`,
      );
    }

    return {
      teacher: updatedTeacher,
      tempPassword,
      userAccountCreated,
    };
  }

  async remove(id: Teacher['id']): Promise<void> {
    return this.teachersRepository.remove(id);
  }

  async resetPassword(id: Teacher['id']): Promise<{ tempPassword: string }> {
    const teacher = await this.teachersRepository.findById(id);
    if (!teacher) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          teacher: 'teacherNotFound',
        },
      });
    }

    if (!teacher.email) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'teacherHasNoEmail',
        },
      });
    }

    // Generate new temporary password
    const tempPassword = randomStringGenerator();

    // Find user by email and update password
    const user = await this.usersService.findByEmail(teacher.email);
    if (user) {
      await this.usersService.update(user.id, {
        password: tempPassword,
      });
      console.log(
        `Teacher password reset: ${teacher.email} - user account updated`,
      );
    } else {
      // If user doesn't exist, create one
      await this.usersService.create({
        email: teacher.email,
        password: tempPassword,
        firstName: teacher.name.split(' ')[0] || teacher.name,
        lastName: teacher.name.split(' ').slice(1).join(' ') || '',
        role: { id: RoleEnum.teacher },
        status: { id: StatusEnum.active },
      });
      console.log(
        `Teacher password reset: ${teacher.email} - new user account created`,
      );
    }

    return { tempPassword };
  }

  async checkTeacherUserAccount(
    teacherId: Teacher['id'],
  ): Promise<{ teacher: Teacher | null; user: any; hasUserAccount: boolean }> {
    const teacher = await this.teachersRepository.findById(teacherId);
    if (!teacher) {
      return { teacher: null, user: null, hasUserAccount: false };
    }

    if (!teacher.email) {
      return { teacher, user: null, hasUserAccount: false };
    }

    const user = await this.usersService.findByEmail(teacher.email);
    return { teacher, user, hasUserAccount: !!user };
  }
}
