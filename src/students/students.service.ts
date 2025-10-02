import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  Inject,
  forwardRef,
} from '@nestjs/common';
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
import { InvoicesService } from '../invoices/invoices.service';
import { ClassesService } from '../classes/classes.service';
import { NotificationService } from '../notifications/notification.service';
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

    return this.enrollmentRepository.findByStudentId(studentId);
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
    const parents = await this.parentsService.getStudents(id);

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

      // Determine currency based on student's country
      const currency = student.country === 'Pakistan' ? 'PKR' : 'USD';

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

      // Format fee
      const currency = student.country === 'Pakistan' ? 'PKR' : 'USD';
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
}
