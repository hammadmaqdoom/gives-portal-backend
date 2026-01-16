import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
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
import { NotificationService } from '../notifications/notification.service';
import { SubjectsService } from '../subjects/subjects.service';
import { FileType } from '../files/domain/file';
import { PublicTeacherDto } from './dto/public-teacher.dto';
import { FileStorageService } from '../files/file-storage.service';
import { ConfigService } from '@nestjs/config';
import { FileDriver } from '../files/config/file-config.type';

@Injectable()
export class TeachersService {
  constructor(
    private readonly teachersRepository: TeacherRepository,
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
    private readonly subjectsService: SubjectsService,
    private readonly fileStorageService: FileStorageService,
    private readonly configService: ConfigService,
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

    // Transform photo from string ID to FileType format
    const teacherData: Partial<Teacher> = {
      ...createTeacherDto,
      photo: createTeacherDto.photo
        ? ({ id: createTeacherDto.photo } as FileType)
        : createTeacherDto.photo === null
          ? null
          : undefined,
    };

    // Create teacher first
    const teacher = await this.teachersRepository.create(teacherData);

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
        // Force password change on first login for temporary credentials
        // UsersService.create supports extra fields in payload via repository; mapper passes through
        // If repository type constrains, this is still safe because unknown fields are ignored by TypeORM
        ...({ mustChangePassword: true } as any),
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

    // Transform photo from string ID to FileType format
    const teacherData: Partial<Teacher> = {
      ...updateTeacherDto,
      photo: updateTeacherDto.photo
        ? ({ id: updateTeacherDto.photo } as FileType)
        : updateTeacherDto.photo === null
          ? null
          : undefined,
    };

    // Update teacher record
    const updatedTeacher = await this.teachersRepository.update(
      id,
      teacherData,
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
        // Ensure forced reset after admin-generated temporary password
        ...({ mustChangePassword: true } as any),
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
        ...({ mustChangePassword: true } as any),
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

  async findPublicTeachers(): Promise<PublicTeacherDto[]> {
    const teachers = await this.teachersRepository.findPublicTeachers();
    return Promise.all(
      teachers.map((teacher) => this.mapToPublicDto(teacher)),
    );
  }

  async findPublicTeacherById(
    id: Teacher['id'],
  ): Promise<PublicTeacherDto | null> {
    const teacher = await this.teachersRepository.findById(id);
    if (!teacher || !teacher.showOnPublicSite) {
      return null;
    }
    return this.mapToPublicDto(teacher);
  }

  /**
   * Map Teacher to PublicTeacherDto, excluding sensitive fields
   * and generating proper URLs for photos
   */
  private async mapToPublicDto(teacher: Teacher): Promise<PublicTeacherDto> {
    const dto = new PublicTeacherDto();
    dto.id = teacher.id;
    dto.name = teacher.name;
    dto.subjectsAllowed = teacher.subjectsAllowed;
    dto.bio = teacher.bio;
    dto.showOnPublicSite = teacher.showOnPublicSite;
    dto.displayOrder = teacher.displayOrder;

    // Handle photo URL - generate presigned URL for S3 files
    if (teacher.photo) {
      const photo = { ...teacher.photo };
      
      // Generate proper URL for the photo
      // For S3 files, use presigned URL; for local files, use serve endpoint
      const fileDriver = await this.fileStorageService.getDriver();
      
      if (fileDriver === FileDriver.LOCAL) {
        // For local files, use the serve endpoint
        const baseUrl = this.getBaseUrl();
        photo.url = `${baseUrl}/api/v1/files/serve/${photo.id}`;
      } else if (
        fileDriver === FileDriver.S3 ||
        fileDriver === FileDriver.S3_PRESIGNED
      ) {
        // For S3 files, generate presigned URL
        try {
          photo.url = await this.fileStorageService.getPresignedFileUrl(
            teacher.photo.path,
            3600, // 1 hour expiry
          );
        } catch (error) {
          console.error('Error generating presigned URL:', error);
          // Fallback to serve endpoint if presigned URL generation fails
          const baseUrl = this.getBaseUrl();
          photo.url = `${baseUrl}/api/v1/files/serve/${photo.id}`;
        }
      } else {
        // Fallback for other storage types
        const baseUrl = this.getBaseUrl();
        photo.url = `${baseUrl}/api/v1/files/serve/${photo.id}`;
      }
      
      dto.photo = photo;
    } else {
      dto.photo = null;
    }

    return dto;
  }

  /**
   * Get base URL for the current server
   */
  private getBaseUrl(): string {
    const backendDomain = this.configService.get('app.backendDomain', {
      infer: true,
    });
    if (backendDomain) {
      return backendDomain;
    }
    // Fallback to environment-based URL
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || '3000';
    return `${protocol}://${host}:${port}`;
  }

  async bulkCreateFromFile(
    file: Express.Multer.File,
    duplicateHandling: 'skip' | 'update' = 'skip',
  ): Promise<{
    totalRows: number;
    successful: number;
    failed: number;
    results: Array<{
      row: number;
      teacherName: string;
      status: 'success' | 'error' | 'skipped';
      message: string;
      teacherId?: number;
      tempPassword?: string;
    }>;
  }> {
    // Parse the file
    let rows: any[] = [];

    try {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        const workbook = XLSX.read(file.buffer, {
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
        });
      } else if (
        file.mimetype ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')
      ) {
        const workbook = XLSX.read(file.buffer, {
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
        });
      } else {
        throw new BadRequestException(
          'Invalid file type. Please upload a CSV or Excel file.',
        );
      }
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to parse file: ${error.message || 'Unknown error'}`,
      );
    }

    if (!rows || rows.length === 0) {
      throw new BadRequestException('File is empty or contains no data');
    }

    const results: Array<{
      row: number;
      teacherName: string;
      status: 'success' | 'error' | 'skipped';
      message: string;
      teacherId?: number;
      tempPassword?: string;
    }> = [];

    let successful = 0;
    let failed = 0;

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

      try {
        // Extract and normalize data
        const name =
          row['Name'] ||
          row['name'] ||
          row['Teacher Name'] ||
          row['TeacherName'] ||
          '';
        const email =
          row['Email'] ||
          row['email'] ||
          row['Teacher Email'] ||
          row['TeacherEmail'] ||
          '';
        const phone =
          row['Phone'] ||
          row['phone'] ||
          row['Teacher Phone'] ||
          row['TeacherPhone'] ||
          row['Contact'] ||
          '';
        const commissionPercentageStr =
          row['Commission %'] ||
          row['Commission%'] ||
          row['commission_percentage'] ||
          row['Commission'] ||
          '';
        const subjectsAllowedStr =
          row['Subjects Allowed'] ||
          row['SubjectsAllowed'] ||
          row['subjects_allowed'] ||
          row['Subjects'] ||
          '';
        const payoutMethod =
          row['Payout Method'] ||
          row['PayoutMethod'] ||
          row['payout_method'] ||
          '';
        const bankName =
          row['Bank Name'] || row['BankName'] || row['bank_name'] || '';
        const accountNumber =
          row['Account Number'] ||
          row['AccountNumber'] ||
          row['account_number'] ||
          '';
        const bankCode =
          row['Bank Code'] || row['BankCode'] || row['bank_code'] || '';
        const iban = row['IBAN'] || row['iban'] || '';
        const accountHolderName =
          row['Account Holder Name'] ||
          row['AccountHolderName'] ||
          row['account_holder_name'] ||
          '';
        const bankBranch =
          row['Bank Branch'] || row['BankBranch'] || row['bank_branch'] || '';
        const bio = row['Bio'] || row['bio'] || row['Biography'] || '';
        const address = row['Address'] || row['address'] || '';
        const city = row['City'] || row['city'] || '';
        const country = row['Country'] || row['country'] || '';
        const cnicNumber = row['CNIC'] || row['cnic'] || row['CNIC Number'] || row['cnicNumber'] || '';
        const qualifications = row['Qualifications'] || row['qualifications'] || '';
        const expertise = row['Expertise'] || row['expertise'] || '';
        const showOnPublicSiteStr =
          row['Show On Public Site'] ||
          row['ShowOnPublicSite'] ||
          row['show_on_public_site'] ||
          row['Public'] ||
          '';
        const displayOrderStr =
          row['Display Order'] ||
          row['DisplayOrder'] ||
          row['display_order'] ||
          row['Order'] ||
          '0';
        
        // Construct bank details string if any bank fields are provided
        let bankDetails = '';
        if (bankName || accountNumber || iban) {
          const details: string[] = [];
          if (bankName) details.push(`Bank: ${bankName}`);
          if (accountNumber) details.push(`Account: ${accountNumber}`);
          if (iban) details.push(`IBAN: ${iban}`);
          if (accountHolderName) details.push(`Holder: ${accountHolderName}`);
          if (bankCode) details.push(`Code: ${bankCode}`);
          if (bankBranch) details.push(`Branch: ${bankBranch}`);
          bankDetails = details.join(', ');
        }

        // Validation
        if (!name || name.trim() === '') {
          results.push({
            row: rowNumber,
            teacherName: name || 'Unknown',
            status: 'error',
            message: 'Name is required',
          });
          failed++;
          continue;
        }

        if (!commissionPercentageStr || commissionPercentageStr.trim() === '') {
          results.push({
            row: rowNumber,
            teacherName: name.trim(),
            status: 'error',
            message: 'Commission % is required',
          });
          failed++;
          continue;
        }

        const commissionPercentage = parseFloat(commissionPercentageStr);
        if (
          isNaN(commissionPercentage) ||
          commissionPercentage < 0 ||
          commissionPercentage > 100
        ) {
          results.push({
            row: rowNumber,
            teacherName: name.trim(),
            status: 'error',
            message: 'Commission % must be a number between 0 and 100',
          });
          failed++;
          continue;
        }

        if (!subjectsAllowedStr || subjectsAllowedStr.trim() === '') {
          results.push({
            row: rowNumber,
            teacherName: name.trim(),
            status: 'error',
            message:
              'Subjects Allowed is required (comma-separated subject IDs)',
          });
          failed++;
          continue;
        }

        // Parse subjects allowed
        const subjectIds = subjectsAllowedStr
          .split(',')
          .map((id: string) => parseInt(id.trim(), 10))
          .filter((id: number) => !isNaN(id));

        if (subjectIds.length === 0) {
          results.push({
            row: rowNumber,
            teacherName: name.trim(),
            status: 'error',
            message:
              'Invalid Subjects Allowed format. Must be comma-separated numbers.',
          });
          failed++;
          continue;
        }

        // Validate subject IDs exist
        const invalidSubjectIds: number[] = [];
        for (const subjectId of subjectIds) {
          const subject = await this.subjectsService.findById(subjectId);
          if (!subject) {
            invalidSubjectIds.push(subjectId);
          }
        }

        if (invalidSubjectIds.length > 0) {
          results.push({
            row: rowNumber,
            teacherName: name.trim(),
            status: 'error',
            message: `Invalid subject IDs: ${invalidSubjectIds.join(', ')}`,
          });
          failed++;
          continue;
        }

        // Check if teacher already exists (by email or phone)
        let existingTeacher: any = null;
        if (email && email.trim()) {
          existingTeacher = await this.teachersRepository.findByEmail(
            email.trim(),
          );
        }
        if (!existingTeacher && phone && phone.trim()) {
          existingTeacher = await this.teachersRepository.findByPhone(
            phone.trim(),
          );
        }

        if (existingTeacher) {
          if (duplicateHandling === 'skip') {
            results.push({
              row: rowNumber,
              teacherName: name.trim(),
              status: 'skipped',
              message: 'Teacher with this email or phone already exists',
              teacherId: existingTeacher.id,
            });
            failed++;
            continue;
          } else {
            // Update existing teacher
            try {
              // Parse boolean and number fields
              const showOnPublicSite = showOnPublicSiteStr?.toLowerCase() === 'true';
              const displayOrder = parseInt(displayOrderStr, 10) || 0;

              const updateTeacherDto: UpdateTeacherDto = {
                name: name.trim(),
                email: email?.trim() || undefined,
                phone: phone?.trim() || undefined,
                showOnPublicSite,
                displayOrder,
                bio: bio?.trim() || undefined,
                payoutMethod: payoutMethod?.trim() || undefined,
                bankName: bankName?.trim() || undefined,
                accountNumber: accountNumber?.trim() || undefined,
                bankCode: bankCode?.trim() || undefined,
                iban: iban?.trim() || undefined,
                accountHolderName: accountHolderName?.trim() || undefined,
                bankBranch: bankBranch?.trim() || undefined,
              };

              // Update subjects allowed if provided
              if (subjectIds && subjectIds.length > 0) {
                updateTeacherDto.subjectsAllowed = subjectIds.map((id) => ({ id }));
              }

              const updateResult = await this.update(existingTeacher.id, updateTeacherDto);

              results.push({
                row: rowNumber,
                teacherName: updateResult.teacher?.name || name.trim(),
                status: 'success',
                message: 'Teacher updated successfully',
                teacherId: updateResult.teacher?.id || existingTeacher.id,
              });
              successful++;
              continue;
            } catch (error: any) {
              results.push({
                row: rowNumber,
                teacherName: name.trim(),
                status: 'error',
                message: `Failed to update: ${error.message || 'Unknown error'}`,
                teacherId: existingTeacher.id,
              });
              failed++;
              continue;
            }
          }
        }

        // Parse boolean and number fields
        const showOnPublicSite = showOnPublicSiteStr.toLowerCase() === 'true';
        const displayOrder = parseInt(displayOrderStr, 10) || 0;

        // Validate payout method if provided
        if (payoutMethod && payoutMethod.trim()) {
          const validPayoutMethods = [
            'bank_transfer',
            'cash',
            'check',
            'online',
          ];
          if (!validPayoutMethods.includes(payoutMethod.trim())) {
            results.push({
              row: rowNumber,
              teacherName: name.trim(),
              status: 'error',
              message: `Invalid payout method. Must be one of: ${validPayoutMethods.join(', ')}`,
            });
            failed++;
            continue;
          }
        }

        // Create teacher
        const createTeacherDto: CreateTeacherDto = {
          name: name.trim(),
          email: email?.trim() || undefined,
          phone: phone?.trim() || undefined,
          commissionPercentage,
          subjectsAllowed: subjectIds,
          payoutMethod: payoutMethod?.trim() || undefined,
          bankName: bankName?.trim() || undefined,
          accountNumber: accountNumber?.trim() || undefined,
          bankCode: bankCode?.trim() || undefined,
          iban: iban?.trim() || undefined,
          accountHolderName: accountHolderName?.trim() || undefined,
          bankBranch: bankBranch?.trim() || undefined,
          bio: bio?.trim() || undefined,
          showOnPublicSite,
          displayOrder,
        };

        const createResult = await this.create(createTeacherDto);

        // Send account credentials email if email and password are available
        if (email && email.trim() && createResult.tempPassword) {
          try {
            await this.notificationService.sendAccountCredentials({
              to: email.trim(),
              userName: name.trim(),
              email: email.trim(),
              tempPassword: createResult.tempPassword,
              isParent: false,
            });
          } catch (emailError) {
            console.error(
              `Error sending account credentials email to teacher ${email}:`,
              emailError,
            );
            // Don't fail the creation if email fails
          }
        }

        results.push({
          row: rowNumber,
          teacherName: createResult.teacher.name,
          status: 'success',
          message: 'Teacher created successfully',
          teacherId: createResult.teacher.id,
          tempPassword: createResult.tempPassword || undefined,
        });
        successful++;
      } catch (error: any) {
        const teacherName =
          row['Name'] ||
          row['name'] ||
          row['Teacher Name'] ||
          row['TeacherName'] ||
          'Unknown';

        results.push({
          row: rowNumber,
          teacherName,
          status: 'error',
          message:
            error.message ||
            error.response?.message ||
            'Failed to create teacher',
        });
        failed++;
      }
    }

    return {
      totalRows: rows.length,
      successful,
      failed,
      results,
    };
  }
}
