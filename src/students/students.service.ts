import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import { CreateStudentDto } from './dto/create-student.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterStudentDto, SortStudentDto } from './dto/query-student.dto';
import { StudentRepository } from './infrastructure/persistence/student.repository';
import { StudentClassEnrollmentRepository } from './infrastructure/persistence/relational/repositories/student-class-enrollment.repository';
import { Student } from './domain/student';
import { FilesService } from '../files/files.service';
import { UsersService } from '../users/users.service';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { FileType } from '../files/domain/file';
import { User } from '../users/domain/user';
import { UpdateStudentDto } from './dto/update-student.dto';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  EnrollmentStatus,
} from './dto/enrollment.dto';
import { ParentsService } from '../parents/parents.service';
import { Parent } from '../parents/domain/parent';
import { InvoicesService } from '../invoices/invoices.service';
import { ClassesService } from '../classes/classes.service';
import { NotificationService } from '../notifications/notification.service';
import { CurrencyService } from '../currency/currency.service';
import { randomStringGenerator } from '../utils/random-string-generator';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';

@Injectable()
export class StudentsService {
  constructor(
    private readonly studentsRepository: StudentRepository,
    private readonly enrollmentRepository: StudentClassEnrollmentRepository,
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ParentsService))
    private readonly parentsService: ParentsService,
    @Inject(forwardRef(() => InvoicesService))
    private readonly invoicesService: InvoicesService,
    @Inject(forwardRef(() => ClassesService))
    private readonly classesService: ClassesService,
    private readonly notificationService: NotificationService,
    private readonly currencyService: CurrencyService,
  ) {}

  async create(
    createStudentDto: CreateStudentDto,
  ): Promise<{ student: Student; user: any; tempPassword: string | null }> {
    // Generate unique student ID
    const studentId = await this.studentsRepository.generateStudentId();

    let photo: FileType | null | undefined = undefined;

    if (createStudentDto.photo?.id) {
      const fileObject = await this.filesService.findById(
        createStudentDto.photo.id,
      );
      if (!fileObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            photo: 'imageNotExists',
          },
        });
      }
      photo = fileObject;
    } else if (createStudentDto.photo === null) {
      photo = null;
    }

    let user: User | undefined = undefined;
    let tempPassword: string | null = null;

    if (createStudentDto.user?.id) {
      const userObject = await this.usersService.findById(
        createStudentDto.user.id,
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
    } else if (createStudentDto.email) {
      // Create user account for student if email is provided
      tempPassword = randomStringGenerator();
      const firstName =
        createStudentDto.name.split(' ')[0] || createStudentDto.name;
      const lastName =
        createStudentDto.name.split(' ').slice(1).join(' ') || '';

      user = await this.usersService.create({
        email: createStudentDto.email,
        password: tempPassword,
        firstName,
        lastName,
        role: { id: RoleEnum.user }, // Students get user role
        status: { id: StatusEnum.active },
      });

      console.log(
        `Student user account created: ${createStudentDto.email} with role: ${user.role?.name}`,
      );
    }

    const student = await this.studentsRepository.create({
      studentId,
      name: createStudentDto.name,
      address: createStudentDto.address,
      city: createStudentDto.city,
      country: createStudentDto.country,
      dateOfBirth: createStudentDto.dateOfBirth
        ? new Date(createStudentDto.dateOfBirth)
        : undefined,
      email: createStudentDto.email,
      contact: createStudentDto.contact,
      photo,
      user,
      userId: user?.id ? Number(user.id) : null, // Explicitly set the userId foreign key
    });

    // Handle class enrollments
    if (createStudentDto.classes && createStudentDto.classes.length > 0) {
      for (const classEnrollment of createStudentDto.classes) {
        await this.enrollmentRepository.create({
          studentId: student.id,
          classId: classEnrollment.id,
          enrollmentDate: new Date(),
          status: 'active',
        });

        // Generate monthly invoice for each enrollment
        await this.generateMonthlyInvoice(student.id, classEnrollment.id);
      }
    }

    // Handle parent relationships
    if (createStudentDto.parents && createStudentDto.parents.length > 0) {
      for (const parentDto of createStudentDto.parents) {
        if (parentDto.id) {
          await this.parentsService.linkStudent(parentDto.id, student.id);
        }
      }
    }

    return { student, user, tempPassword };
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
    includeRelations,
  }: {
    filterOptions?: FilterStudentDto | null;
    sortOptions?: SortStudentDto[] | null;
    paginationOptions: IPaginationOptions;
    includeRelations?: boolean;
  }): Promise<Student[]> {
    return this.studentsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
      includeRelations,
    });
  }

  async findById(id: Student['id']): Promise<NullableType<Student>> {
    const student = await this.studentsRepository.findById(id);
    return student;
  }

  async findByUserId(userId: number): Promise<NullableType<Student>> {
    console.log(
      `🔍 StudentsService.findByUserId called with userId: ${userId}`,
    );

    const student = await this.studentsRepository.findByUserId(userId);

    console.log(`🔍 StudentsService.findByUserId result:`, student);
    console.log(
      `🔍 StudentsService.findByUserId result userId:`,
      student?.userId,
    );

    return student;
  }

  async findByEmail(email: string): Promise<NullableType<Student>> {
    console.log(`StudentsService.findByEmail called with email: ${email}`);
    const student = await this.studentsRepository.findByEmail(email);
    console.log(`StudentsService.findByEmail result:`, student);
    return student;
  }

  async findByStudentId(
    studentId: Student['studentId'],
  ): Promise<NullableType<Student>> {
    return this.studentsRepository.findByStudentId(studentId);
  }

  async update(
    id: number,
    updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    const student = await this.studentsRepository.findById(id);
    if (!student) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          id: 'studentNotExists',
        },
      });
    }

    let photo: FileType | null | undefined = undefined;

    if (updateStudentDto.photo?.id) {
      const fileObject = await this.filesService.findById(
        updateStudentDto.photo.id,
      );
      if (!fileObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            photo: 'imageNotExists',
          },
        });
      }
      photo = fileObject;
    } else if (updateStudentDto.photo === null) {
      photo = null;
    }

    let user: User | undefined = undefined;

    if (updateStudentDto.user?.id) {
      const userObject = await this.usersService.findById(
        updateStudentDto.user.id,
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

    const updatedStudent = await this.studentsRepository.update(id, {
      name: updateStudentDto.name,
      address: updateStudentDto.address,
      city: updateStudentDto.city,
      country: updateStudentDto.country,
      dateOfBirth: updateStudentDto.dateOfBirth
        ? new Date(updateStudentDto.dateOfBirth)
        : undefined,
      email: updateStudentDto.email,
      contact: updateStudentDto.contact,
      photo,
      user,
      userId: user?.id ? Number(user.id) : null, // Explicitly set the userId foreign key
    });

    if (!updatedStudent) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          id: 'studentNotExists',
        },
      });
    }

    // Handle class enrollments updates
    if (updateStudentDto.classes) {
      // Remove existing enrollments
      const existingEnrollments =
        await this.enrollmentRepository.findByStudentId(id);
      for (const enrollment of existingEnrollments) {
        await this.enrollmentRepository.remove(enrollment.id);
      }

      // Add new enrollments
      for (const classEnrollment of updateStudentDto.classes) {
        await this.enrollmentRepository.create({
          studentId: id,
          classId: classEnrollment.id,
          enrollmentDate: new Date(),
          status: 'active',
        });

        // Generate monthly invoice for each new enrollment
        await this.generateMonthlyInvoice(id, classEnrollment.id);
      }
    }

    // Handle parent relationships updates
    if (updateStudentDto.parents) {
      // Remove existing parent relationships
      const existingParents = await this.parentsService.getStudents(id);
      for (const parent of existingParents) {
        await this.parentsService.unlinkStudent(parent.id, id);
      }

      // Add new parent relationships
      for (const parentDto of updateStudentDto.parents) {
        if (parentDto.id) {
          await this.parentsService.linkStudent(parentDto.id, id);
        }
      }
    }

    return updatedStudent;
  }

  async remove(id: number): Promise<void> {
    const student = await this.studentsRepository.findById(id);
    if (!student) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          id: 'studentNotExists',
        },
      });
    }

    // Remove all enrollments
    const enrollments = await this.enrollmentRepository.findByStudentId(id);
    for (const enrollment of enrollments) {
      await this.enrollmentRepository.remove(enrollment.id);
    }

    // Remove parent relationships
    const parents = await this.parentsService.getStudents(id);
    for (const parent of parents) {
      await this.parentsService.unlinkStudent(parent.id, id);
    }

    await this.studentsRepository.remove(id);
  }

  async enrollInClass(
    studentId: number,
    createEnrollmentDto: CreateEnrollmentDto,
  ): Promise<any> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          studentId: 'studentNotExists',
        },
      });
    }

    // Check if already enrolled
    const existingEnrollment =
      await this.enrollmentRepository.findByStudentAndClass(
        studentId,
        createEnrollmentDto.classId,
      );
    if (existingEnrollment) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          enrollment: 'alreadyEnrolled',
        },
      });
    }

    const enrollment = await this.enrollmentRepository.create({
      studentId,
      classId: createEnrollmentDto.classId,
      enrollmentDate: createEnrollmentDto.enrollmentDate
        ? new Date(createEnrollmentDto.enrollmentDate)
        : new Date(),
      status: createEnrollmentDto.status || 'active',
    });

    // Generate monthly invoice for the enrollment
    await this.generateMonthlyInvoice(studentId, createEnrollmentDto.classId);

    // Send enrollment notification email
    try {
      await this.sendEnrollmentNotification(
        studentId,
        createEnrollmentDto.classId,
      );
    } catch (error) {
      console.error('Error sending enrollment notification:', error);
      // Don't fail the enrollment if notification fails
    }

    return enrollment;
  }

  async updateEnrollment(
    studentId: number,
    classId: number,
    updateEnrollmentDto: UpdateEnrollmentDto,
  ): Promise<any> {
    const enrollment = await this.enrollmentRepository.findByStudentAndClass(
      studentId,
      classId,
    );
    if (!enrollment) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          enrollment: 'enrollmentNotExists',
        },
      });
    }

    const updatedEnrollment = await this.enrollmentRepository.update(
      enrollment.id,
      {
        status: updateEnrollmentDto.status,
        enrollmentDate: updateEnrollmentDto.enrollmentDate
          ? new Date(updateEnrollmentDto.enrollmentDate)
          : undefined,
      },
    );

    return updatedEnrollment;
  }

  async removeEnrollment(studentId: number, classId: number): Promise<void> {
    const enrollment = await this.enrollmentRepository.findByStudentAndClass(
      studentId,
      classId,
    );
    if (!enrollment) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          enrollment: 'enrollmentNotExists',
        },
      });
    }

    await this.enrollmentRepository.remove(enrollment.id);

    // Send unenrollment notification email
    try {
      await this.sendUnenrollmentNotification(
        studentId,
        classId,
        'Student unenrolled from class',
      );
    } catch (error) {
      console.error('Error sending unenrollment notification:', error);
      // Don't fail the unenrollment if notification fails
    }
  }

  async getEnrollments(studentId: number): Promise<any[]> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          studentId: 'studentNotExists',
        },
      });
    }

    const enrollments = await this.enrollmentRepository.findByStudentId(studentId);
    
    // Enrich classes with image URLs
    await Promise.all(
      enrollments.map(async (enrollment) => {
        if (enrollment.class) {
          await this.classesService.enrichClassWithImageUrls(enrollment.class);
        }
      })
    );

    return enrollments;
  }

  async getEnrollmentHistory(studentId: number): Promise<any[]> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          studentId: 'studentNotExists',
        },
      });
    }

    const enrollments = await this.enrollmentRepository.findEnrollmentHistoryByStudentId(
      studentId,
    );
    
    // Enrich classes with image URLs
    await Promise.all(
      enrollments.map(async (enrollment) => {
        if (enrollment.class) {
          await this.classesService.enrichClassWithImageUrls(enrollment.class);
        }
      })
    );

    return enrollments;
  }

  async getClassEnrollmentHistory(classId: number): Promise<any[]> {
    const enrollments = await this.enrollmentRepository.findEnrollmentHistoryByClassId(classId);
    
    // Enrich classes with image URLs
    await Promise.all(
      enrollments.map(async (enrollment) => {
        if (enrollment.class) {
          await this.classesService.enrichClassWithImageUrls(enrollment.class);
        }
      })
    );

    return enrollments;
  }

  async getAllEnrollments(options?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      this.enrollmentRepository.findAll({
        skip,
        take: limit,
        order: { enrollmentDate: 'DESC' },
      }),
      this.enrollmentRepository.count(),
    ]);
    
    // Enrich classes with image URLs
    await Promise.all(
      enrollments.map(async (enrollment) => {
        if (enrollment.class) {
          await this.classesService.enrichClassWithImageUrls(enrollment.class);
        }
      })
    );

    return {
      data: enrollments,
      total,
      page,
      limit,
    };
  }

  async getEnrollmentStats(): Promise<{
    total: number;
    active: number;
    dropped: number;
    thisMonth: number;
  }> {
    const [total, active, dropped, thisMonth] = await Promise.all([
      this.enrollmentRepository.count(),
      this.enrollmentRepository.countByStatus('active'),
      this.enrollmentRepository.countByStatus('dropped'),
      this.enrollmentRepository.countThisMonth(),
    ]);

    return {
      total,
      active,
      dropped,
      thisMonth,
    };
  }

  async bulkEnrollStudentInClasses(
    studentId: number,
    body: { 
      classIds: number[]; 
      status?: string; 
      enrollmentDate?: string;
      customFees?: Array<{ classId: number; customFeePKR?: number | null; customFeeUSD?: number | null }>;
    },
  ): Promise<{ count: number; enrollments: any[] }> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          studentId: 'studentNotExists',
        },
      });
    }

    const status = (body.status as any) || 'active';
    const date = body.enrollmentDate
      ? new Date(body.enrollmentDate)
      : new Date();

    // Create a map of custom fees by classId for quick lookup
    const customFeesMap = new Map<number, { customFeePKR?: number | null; customFeeUSD?: number | null }>();
    if (body.customFees) {
      for (const fee of body.customFees) {
        customFeesMap.set(fee.classId, {
          customFeePKR: fee.customFeePKR,
          customFeeUSD: fee.customFeeUSD,
        });
      }
    }

    const enrollments: any[] = [];
    let created = 0;

    for (const classId of body.classIds || []) {
      try {
        // Check if already enrolled
        const exists = await this.enrollmentRepository.findByStudentAndClass(
          studentId,
          classId,
        );
        if (exists) {
          continue; // Skip if already enrolled
        }

        // Get custom fees for this class if available
        const customFees = customFeesMap.get(classId);

        const enrollment = await this.enrollmentRepository.create({
          studentId,
          classId,
          enrollmentDate: date,
          status,
          customFeePKR: customFees?.customFeePKR ?? null,
          customFeeUSD: customFees?.customFeeUSD ?? null,
        });

        enrollments.push(enrollment);
        created++;

        // Generate monthly invoice for the enrollment
        try {
          await this.generateMonthlyInvoice(studentId, classId);
        } catch (error) {
          console.error(
            `Error generating invoice for student ${studentId} in class ${classId}:`,
            error,
          );
        }

        // Send enrollment notification email
        try {
          await this.sendEnrollmentNotification(studentId, classId);
        } catch (error) {
          console.error(
            `Error sending enrollment notification for student ${studentId} in class ${classId}:`,
            error,
          );
        }
      } catch (error) {
        console.error(
          `Error enrolling student ${studentId} in class ${classId}:`,
          error,
        );
        // Continue with other classes even if one fails
      }
    }

    return { count: created, enrollments };
  }

  async getStudentWithDetails(id: number): Promise<any> {
    const student = await this.studentsRepository.findById(id);
    if (!student) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          id: 'studentNotExists',
        },
      });
    }

    const enrollments = await this.enrollmentRepository.findByStudentId(id);
    const parents = await this.parentsService.findByStudentId(id);

    return {
      ...student,
      enrollments,
      parents,
    };
  }

  // Generate monthly invoice for a student's enrollments
  async generateMonthlyInvoice(
    studentId: number,
    classId: number,
  ): Promise<void> {
    try {
      console.log(
        `Generating monthly invoice for student ${studentId}, class ${classId}`,
      );

      // Get student details
      const student = await this.studentsRepository.findById(studentId);
      if (!student) {
        console.log(`Student ${studentId} not found`);
        return;
      }

      // Get class details to get fee information
      const classDetails = await this.classesService.findById(classId);
      if (!classDetails) {
        console.log(`Class ${classId} not found`);
        return;
      }

      // Determine currency based on student's country using utility function
      const currency = this.currencyService.getCurrencyForCountry(student.country);

      // Get the appropriate fee based on currency
      const classFee =
        currency === 'PKR' ? classDetails.feePKR : classDetails.feeUSD;

      // Get current month and year for invoice
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();

      // Check if invoice already exists for this month
      const existingInvoices =
        await this.invoicesService.findByStudent(studentId);
      const monthlyInvoice = existingInvoices.find((invoice) => {
        const invoiceDate = new Date(invoice.generatedDate);
        return (
          invoiceDate.getMonth() + 1 === currentMonth &&
          invoiceDate.getFullYear() === currentYear
        );
      });

      if (monthlyInvoice) {
        console.log(
          `Monthly invoice already exists for student ${studentId}, month ${currentMonth}/${currentYear}`,
        );
        // Add class fee to existing invoice
        const updatedAmount = monthlyInvoice.amount + classFee;
        await this.invoicesService.update(monthlyInvoice.id, {
          amount: updatedAmount,
          description: `${monthlyInvoice.description} + ${classDetails.name} fee`,
        });
        console.log(
          `Updated existing invoice ${monthlyInvoice.invoiceNumber} with additional fee ${classFee} ${currency}`,
        );
        return;
      }

      // Generate invoice number
      const invoiceNumber = await this.invoicesService.generateInvoiceNumber();

      // Calculate due date (end of current month)
      const dueDate = new Date(currentYear, currentMonth, 0); // Last day of current month

      // Create invoice
      const invoiceData = {
        invoiceNumber,
        studentId,
        parentId: undefined, // Will be set if parent exists
        amount: 0, // Will be set based on class fee
        currency,
        status: 'draft' as any,
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Monthly tuition fee for ${classDetails.name} - ${currentMonth}/${currentYear}`,
        notes: `Auto-generated invoice for class enrollment in ${classDetails.name}`,
      };

      // Set the actual class fee
      invoiceData.amount = classFee;

      const invoice = await this.invoicesService.create(invoiceData);
      console.log(
        `Generated invoice ${invoiceNumber} for student ${studentId}`,
      );
    } catch (error) {
      console.error(
        `Error generating monthly invoice for student ${studentId}, class ${classId}:`,
        error,
      );
    }
  }

  private async sendEnrollmentNotification(
    studentId: number,
    classId: number,
  ): Promise<void> {
    try {
      const student = await this.studentsRepository.findById(studentId);
      if (!student) return;

      const classDetails = await this.classesService.findById(classId);
      if (!classDetails) return;

      // Get student's parents
      const parents = await this.parentsService.findByStudentId(studentId);
      if (!parents || parents.length === 0) return;

      // Get class teacher
      const teacher = classDetails.teacher;

      // Format schedule
      const schedule =
        classDetails.schedules
          ?.map(
            (s) => `${s.weekday} ${s.startTime}-${s.endTime} (${s.timezone})`,
          )
          .join(', ') || 'Schedule TBD';

      // Format fee based on student's country
      const currency = this.currencyService.getCurrencyForCountry(student.country);
      const fee =
        currency === 'PKR' ? classDetails.feePKR : classDetails.feeUSD;
      const formattedFee = `${fee} ${currency}`;

      // Send notification to all parents
      for (const parent of parents) {
        if (parent.email) {
          await this.notificationService.sendClassEnrollmentNotification({
            to: parent.email,
            parentName: parent.fullName,
            studentName: student.name,
            className: classDetails.name,
            subjectName: classDetails.subject?.name || 'N/A',
            teacherName: teacher?.name || 'TBD',
            schedule,
            fee: formattedFee,
          });
        }
      }
    } catch (error) {
      console.error('Error sending enrollment notification:', error);
    }
  }

  private async sendUnenrollmentNotification(
    studentId: number,
    classId: number,
    reason: string,
  ): Promise<void> {
    try {
      const student = await this.studentsRepository.findById(studentId);
      if (!student) return;

      const classDetails = await this.classesService.findById(classId);
      if (!classDetails) return;

      // Get student's parents
      const parents = await this.parentsService.findByStudentId(studentId);
      if (!parents || parents.length === 0) return;

      // Get class teacher
      const teacher = classDetails.teacher;

      // Send notification to all parents
      for (const parent of parents) {
        if (parent.email) {
          await this.notificationService.sendClassUnenrollmentNotification({
            to: parent.email,
            parentName: parent.fullName,
            studentName: student.name,
            className: classDetails.name,
            subjectName: classDetails.subject?.name || 'N/A',
            teacherName: teacher?.name || 'TBD',
            reason,
          });
        }
      }
    } catch (error) {
      console.error('Error sending unenrollment notification:', error);
    }
  }

  // Student-User Linking Methods
  async linkStudentToUser(
    studentId: number,
    userId: number,
  ): Promise<Student | null> {
    const student = await this.studentsRepository.findById(studentId);
    if (!student) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          studentId: 'studentNotExists',
        },
      });
    }

    // Verify user exists
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          userId: 'userNotExists',
        },
      });
    }

    // Update student with userId
    const updatedStudent = await this.studentsRepository.update(studentId, {
      userId,
    });
    return updatedStudent;
  }

  async autoLinkStudentsToUsers(): Promise<{
    linked: number;
    notFound: number;
    errors: number;
  }> {
    const students = await this.studentsRepository.findManyWithPagination({
      filterOptions: { userId: null as any },
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
      includeRelations: false,
    });

    let linked = 0;
    let notFound = 0;
    let errors = 0;

    for (const student of students) {
      try {
        if (student.email) {
          // Find user by email
          const user = await this.usersService.findByEmail(student.email);
          if (user) {
            await this.studentsRepository.update(student.id, {
              userId: Number(user.id),
            });
            linked++;
            console.log(
              `✅ Linked student "${student.name}" to user ID ${user.id}`,
            );
          } else {
            notFound++;
            console.log(
              `❌ No user found for student "${student.name}" with email ${student.email}`,
            );
          }
        } else {
          notFound++;
          console.log(`❌ Student "${student.name}" has no email address`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error linking student "${student.name}":`, error);
      }
    }

    return { linked, notFound, errors };
  }

  async bulkEnrollFromFile(
    file: Express.Multer.File,
    duplicateHandling: 'skip' | 'update' = 'skip',
  ): Promise<{
    totalRows: number;
    successful: number;
    failed: number;
    results: Array<{
      row: number;
      studentName: string;
      status: 'success' | 'error' | 'skipped';
      message: string;
      studentId?: number;
      parentIds?: number[];
      classIds?: number[];
    }>;
  }> {
    // Parse the file
    let rows: any[] = [];

    try {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        // Parse CSV - XLSX can handle CSV files
        const workbook = XLSX.read(file.buffer, {
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '', // Default value for empty cells
          raw: false, // Use formatted strings
        });
      } else if (
        file.mimetype ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')
      ) {
        // Parse Excel
        const workbook = XLSX.read(file.buffer, {
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '', // Default value for empty cells
          raw: false, // Use formatted strings
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
      studentName: string;
      status: 'success' | 'error' | 'skipped';
      message: string;
      studentId?: number;
      parentIds?: number[];
      classIds?: number[];
    }> = [];

    let successful = 0;
    let failed = 0;

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

      try {
        // Extract and normalize data (handle different column name variations)
        const classIdsStr =
          row['Class ID'] ||
          row['ClassID'] ||
          row['class_id'] ||
          row['ClassId'] ||
          row['Class IDs'] ||
          '';
        const studentName =
          row['Student Name'] ||
          row['StudentName'] ||
          row['student_name'] ||
          row['Name'] ||
          '';
        const studentEmail =
          row['Student Email'] ||
          row['StudentEmail'] ||
          row['student_email'] ||
          row['Email'] ||
          '';
        const studentContact =
          row['Student Contact'] ||
          row['StudentContact'] ||
          row['student_contact'] ||
          row['Contact'] ||
          row['Phone'] ||
          '';
        const studentAddress =
          row['Student Address'] ||
          row['StudentAddress'] ||
          row['student_address'] ||
          row['Address'] ||
          '';
        const studentCity =
          row['Student City'] ||
          row['StudentCity'] ||
          row['student_city'] ||
          row['City'] ||
          '';
        const studentState =
          row['Student State'] ||
          row['StudentState'] ||
          row['student_state'] ||
          row['State'] ||
          '';
        const studentCountry =
          row['Student Country'] ||
          row['StudentCountry'] ||
          row['student_country'] ||
          row['Country'] ||
          '';
        const studentDateOfBirth =
          row['Student Date of Birth'] ||
          row['StudentDateOfBirth'] ||
          row['student_date_of_birth'] ||
          row['Date of Birth'] ||
          row['DOB'] ||
          '';

        // Parent 1
        const parent1Name =
          row['Parent 1 Name'] ||
          row['Parent1Name'] ||
          row['parent_1_name'] ||
          row['Parent Name'] ||
          '';
        const parent1Email =
          row['Parent 1 Email'] ||
          row['Parent1Email'] ||
          row['parent_1_email'] ||
          row['Parent Email'] ||
          '';
        const parent1Mobile =
          row['Parent 1 Mobile'] ||
          row['Parent1Mobile'] ||
          row['parent_1_mobile'] ||
          row['Parent Mobile'] ||
          row['Parent Contact'] ||
          '';
        const parent1Relationship =
          row['Parent 1 Relationship'] ||
          row['Parent1Relationship'] ||
          row['parent_1_relationship'] ||
          row['Relationship'] ||
          '';

        // Parent 2 (optional)
        const parent2Name =
          row['Parent 2 Name'] ||
          row['Parent2Name'] ||
          row['parent_2_name'] ||
          '';
        const parent2Email =
          row['Parent 2 Email'] ||
          row['Parent2Email'] ||
          row['parent_2_email'] ||
          '';
        const parent2Mobile =
          row['Parent 2 Mobile'] ||
          row['Parent2Mobile'] ||
          row['parent_2_mobile'] ||
          '';
        const parent2Relationship =
          row['Parent 2 Relationship'] ||
          row['Parent2Relationship'] ||
          row['parent_2_relationship'] ||
          '';

        // Custom fees
        const customPKRStr =
          row['Custom PKR'] ||
          row['CustomPKR'] ||
          row['custom_pkr'] ||
          row['CustomPKR'] ||
          '';
        const customUSDStr =
          row['Custom USD'] ||
          row['CustomUSD'] ||
          row['custom_usd'] ||
          row['CustomUSD'] ||
          '';

        // Validation
        if (!studentName || studentName.trim() === '') {
          results.push({
            row: rowNumber,
            studentName: 'Unknown',
            status: 'error',
            message: 'Student name is required',
          });
          failed++;
          continue;
        }

        if (!classIdsStr || classIdsStr.toString().trim() === '') {
          results.push({
            row: rowNumber,
            studentName: studentName.trim(),
            status: 'error',
            message: 'Class ID is required',
          });
          failed++;
          continue;
        }

        // Parse class IDs (semicolon-separated)
        const classIdStrings = classIdsStr
          .toString()
          .split(';')
          .map((id: string) => id.trim())
          .filter((id: string) => id !== '');
        const classIds = classIdStrings
          .map((id: string) => parseInt(id, 10))
          .filter((id: number) => !isNaN(id));

        // Parse custom fees (semicolon-separated, 0 = use default = null)
        const parseCustomFees = (feeStr: string, classCount: number): (number | null)[] => {
          if (!feeStr || feeStr.toString().trim() === '') {
            return new Array(classCount).fill(null);
          }
          const feeStrings = feeStr
            .toString()
            .split(';')
            .map((fee: string) => fee.trim())
            .filter((fee: string) => fee !== '');
          
          const fees: (number | null)[] = [];
          for (let i = 0; i < classCount; i++) {
            if (i < feeStrings.length && feeStrings[i] !== '') {
              const feeValue = parseFloat(feeStrings[i]);
              // 0 means use default, so store as null
              fees.push(isNaN(feeValue) || feeValue === 0 ? null : feeValue);
            } else {
              fees.push(null);
            }
          }
          return fees;
        };

        if (classIds.length === 0) {
          results.push({
            row: rowNumber,
            studentName: studentName.trim(),
            status: 'error',
            message: 'Invalid class ID format',
          });
          failed++;
          continue;
        }

        // Verify classes exist - omit invalid class IDs but continue if at least one is valid
        const validClassIds: number[] = [];
        const invalidClassIds: number[] = [];
        const validClassIndices: number[] = []; // Track original indices of valid classes
        for (let i = 0; i < classIds.length; i++) {
          const classId = classIds[i];
          const classEntity = await this.classesService.findById(classId);
          if (!classEntity) {
            invalidClassIds.push(classId);
          } else {
            validClassIds.push(classId);
            validClassIndices.push(i); // Store original index
          }
        }

        // Parse custom fees based on original classIds array, then map to valid classes
        const allCustomPKRs = parseCustomFees(customPKRStr, classIds.length);
        const allCustomUSDs = parseCustomFees(customUSDStr, classIds.length);
        
        // Map custom fees to valid class IDs by their original indices
        const customPKRs = validClassIndices.map((idx) => allCustomPKRs[idx]);
        const customUSDs = validClassIndices.map((idx) => allCustomUSDs[idx]);

        // If no valid class IDs found, skip this row
        if (validClassIds.length === 0) {
          const errorMessage =
            invalidClassIds.length > 0
              ? `Class ID(s) not found: ${invalidClassIds.join(', ')}`
              : 'No valid class IDs found';
          results.push({
            row: rowNumber,
            studentName: studentName.trim(),
            status: 'error',
            message: errorMessage,
          });
          failed++;
          continue;
        }

        // If some class IDs are invalid, log a warning but continue with valid ones
        if (invalidClassIds.length > 0) {
          console.warn(
            `Row ${rowNumber}: Invalid class IDs ${invalidClassIds.join(', ')} will be omitted. Using valid class IDs: ${validClassIds.join(', ')}`,
          );
        }

        // Check if student already exists (by email OR phone number)
        let student: NullableType<Student> = null;
        let duplicateReason: 'email' | 'phone' | null = null;
        
        // First check by email
        if (studentEmail && studentEmail.trim()) {
          student = await this.studentsRepository.findByEmail(studentEmail.trim());
          if (student) {
            duplicateReason = 'email';
          }
        }
        
        // If not found by email, check by phone/contact
        if (!student && studentContact && studentContact.trim()) {
          student = await this.studentsRepository.findByContact(studentContact.trim());
          if (student) {
            duplicateReason = 'phone';
          }
        }

        // Create or update student
        let studentTempPassword: string | null = null;
        if (!student) {
          // Create student without classes first (we'll add enrollments with custom fees separately)
          const createStudentDto: CreateStudentDto = {
            name: studentName.trim(),
            email: studentEmail?.trim() || undefined,
            contact: studentContact?.trim() || undefined,
            address: studentAddress?.trim() || undefined,
            city: studentCity?.trim() || undefined,
            state: studentState?.trim() || undefined,
            country: studentCountry?.trim() || undefined,
            dateOfBirth: studentDateOfBirth?.trim() || undefined,
            classes: [], // Don't create enrollments here, we'll do it with custom fees
          };

          const createResult = await this.create(createStudentDto);
          student = createResult.student;
          studentTempPassword = createResult.tempPassword;

          // Create enrollments with custom fees
          for (let i = 0; i < validClassIds.length; i++) {
            const classId = validClassIds[i];
            const customPKR = i < customPKRs.length ? customPKRs[i] : null;
            const customUSD = i < customUSDs.length ? customUSDs[i] : null;
            
            try {
              await this.enrollmentRepository.create({
                studentId: student.id,
                classId,
                status: 'active',
                enrollmentDate: new Date(),
                customFeePKR: customPKR,
                customFeeUSD: customUSD,
              });

              // Generate monthly invoice for each enrollment
              await this.generateMonthlyInvoice(student.id, classId);
            } catch (error) {
              console.error(
                `Error enrolling student ${student.id} in class ${classId}:`,
                error,
              );
            }
          }

          // Send account credentials email to student if email and password are available
          if (studentEmail && studentEmail.trim() && studentTempPassword) {
            try {
              await this.notificationService.sendAccountCredentials({
                to: studentEmail.trim(),
                userName: studentName.trim(),
                email: studentEmail.trim(),
                tempPassword: studentTempPassword,
                isParent: false,
              });
            } catch (emailError) {
              console.error(
                `Error sending account credentials email to student ${studentEmail}:`,
                emailError,
              );
              // Don't fail the enrollment if email fails
            }
          }
        } else if (student) {
          // Handle duplicate student based on duplicateHandling option
          if (duplicateHandling === 'skip') {
            const duplicateField = duplicateReason === 'phone' ? 'phone number' : 'email';
            results.push({
              row: rowNumber,
              studentName: studentName.trim(),
              status: 'skipped',
              message: `Student with this ${duplicateField} already exists (ID: ${student.id}, Name: ${student.name})`,
              studentId: student.id,
            });
            failed++;
            continue;
          } else {
            // Update existing student information
            try {
              const updateStudentDto: UpdateStudentDto = {
                name: studentName.trim(),
                email: studentEmail?.trim() || undefined,
                contact: studentContact?.trim() || undefined,
                address: studentAddress?.trim() || undefined,
                city: studentCity?.trim() || undefined,
                state: studentState?.trim() || undefined,
                country: studentCountry?.trim() || undefined,
                dateOfBirth: studentDateOfBirth?.trim() || undefined,
              };

              student = await this.update(student.id, updateStudentDto);
            } catch (updateError) {
              console.error(
                `Error updating student ${student.id}:`,
                updateError,
              );
              // Continue with enrollment even if update fails
            }
          }

          // Enroll existing student in classes with custom fees
          for (let i = 0; i < validClassIds.length; i++) {
            const classId = validClassIds[i];
            const customPKR = i < customPKRs.length ? customPKRs[i] : null;
            const customUSD = i < customUSDs.length ? customUSDs[i] : null;
            
            try {
              const existingEnrollment =
                await this.enrollmentRepository.findByStudentAndClass(
                  student.id,
                  classId,
                );
              if (!existingEnrollment) {
                await this.enrollmentRepository.create({
                  studentId: student.id,
                  classId,
                  status: 'active',
                  enrollmentDate: new Date(),
                  customFeePKR: customPKR,
                  customFeeUSD: customUSD,
                });

                // Generate monthly invoice for each enrollment
                await this.generateMonthlyInvoice(student.id, classId);
              }
            } catch (error) {
              // Ignore duplicate enrollment errors
              console.error(
                `Error enrolling student ${student.id} in class ${classId}:`,
                error,
              );
            }
          }
        }

        // Ensure student is not null before proceeding
        if (!student) {
          results.push({
            row: rowNumber,
            studentName: studentName.trim(),
            status: 'error',
            message: 'Failed to create or find student',
          });
          failed++;
          continue;
        }

        // Process parents
        const parentIds: number[] = [];

        // Parent 1
        if (parent1Name && parent1Name.trim()) {
          let parent1: NullableType<Parent> = null;
          if (parent1Email && parent1Email.trim()) {
            parent1 = await this.parentsService.findByEmail(
              parent1Email.trim(),
            );
          } else if (parent1Mobile && parent1Mobile.trim()) {
            parent1 = await this.parentsService.findByMobile(
              parent1Mobile.trim(),
            );
          }

          if (!parent1) {
            const createParentDto = {
              fullName: parent1Name.trim(),
              email: parent1Email?.trim() || undefined,
              mobile: parent1Mobile?.trim() || undefined,
              relationship:
                (parent1Relationship?.trim() as
                  | 'father'
                  | 'mother'
                  | 'guardian') || undefined,
            };
            const createResult =
              await this.parentsService.create(createParentDto);
            parent1 = createResult.parent;

            // Send account credentials email to parent if email and password are available
            if (
              parent1Email &&
              parent1Email.trim() &&
              createResult.tempPassword
            ) {
              try {
                await this.notificationService.sendAccountCredentials({
                  to: parent1Email.trim(),
                  userName: parent1Name.trim(),
                  email: parent1Email.trim(),
                  tempPassword: createResult.tempPassword,
                  isParent: true,
                });
              } catch (emailError) {
                console.error(
                  `Error sending account credentials email to parent ${parent1Email}:`,
                  emailError,
                );
                // Don't fail the enrollment if email fails
              }
            }
          }

          if (parent1 && student) {
            parentIds.push(parent1.id);
            // Link parent to student if not already linked
            try {
              await this.parentsService.linkStudent(parent1.id, student.id);
            } catch (error) {
              // Ignore if already linked
              console.error(
                `Error linking parent ${parent1.id} to student ${student.id}:`,
                error,
              );
            }
          }
        }

        // Parent 2 (optional)
        if (parent2Name && parent2Name.trim()) {
          let parent2: NullableType<Parent> = null;
          if (parent2Email && parent2Email.trim()) {
            parent2 = await this.parentsService.findByEmail(
              parent2Email.trim(),
            );
          } else if (parent2Mobile && parent2Mobile.trim()) {
            parent2 = await this.parentsService.findByMobile(
              parent2Mobile.trim(),
            );
          }

          if (!parent2) {
            const createParentDto = {
              fullName: parent2Name.trim(),
              email: parent2Email?.trim() || undefined,
              mobile: parent2Mobile?.trim() || undefined,
              relationship:
                (parent2Relationship?.trim() as
                  | 'father'
                  | 'mother'
                  | 'guardian') || undefined,
            };
            const createResult =
              await this.parentsService.create(createParentDto);
            parent2 = createResult.parent;

            // Send account credentials email to parent if email and password are available
            if (
              parent2Email &&
              parent2Email.trim() &&
              createResult.tempPassword
            ) {
              try {
                await this.notificationService.sendAccountCredentials({
                  to: parent2Email.trim(),
                  userName: parent2Name.trim(),
                  email: parent2Email.trim(),
                  tempPassword: createResult.tempPassword,
                  isParent: true,
                });
              } catch (emailError) {
                console.error(
                  `Error sending account credentials email to parent ${parent2Email}:`,
                  emailError,
                );
                // Don't fail the enrollment if email fails
              }
            }
          }

          if (parent2 && student) {
            parentIds.push(parent2.id);
            // Link parent to student if not already linked
            try {
              await this.parentsService.linkStudent(parent2.id, student.id);
            } catch (error) {
              // Ignore if already linked
              console.error(
                `Error linking parent ${parent2.id} to student ${student.id}:`,
                error,
              );
            }
          }
        }

        // Final check to ensure student exists before adding to results
        if (student) {
          results.push({
            row: rowNumber,
            studentName: studentName.trim(),
            status: 'success',
            message: `Student enrolled in ${validClassIds.length} class(es)`,
            studentId: student.id,
            parentIds,
            classIds: validClassIds,
          });
          successful++;
        } else {
          results.push({
            row: rowNumber,
            studentName: studentName.trim(),
            status: 'error',
            message: 'Failed to create or find student',
          });
          failed++;
        }
      } catch (error: any) {
        results.push({
          row: rowNumber,
          studentName: row['Student Name'] || row['Name'] || 'Unknown',
          status: 'error',
          message: error.message || 'Unknown error occurred',
        });
        failed++;
        console.error(`Error processing row ${rowNumber}:`, error);
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
