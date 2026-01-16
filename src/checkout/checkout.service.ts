import {
  Injectable,
  Logger,
  UnprocessableEntityException,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from '../cart/cart.service';
import { StudentsService } from '../students/students.service';
import { ParentsService } from '../parents/parents.service';
import { InvoicesService } from '../invoices/invoices.service';
import { ClassesService } from '../classes/classes.service';
import { StudentClassEnrollmentRepository } from '../students/infrastructure/persistence/relational/repositories/student-class-enrollment.repository';
import { InvoiceStatus } from '../invoices/domain/invoice';
import { NotificationService } from '../notifications/notification.service';

export interface CheckoutSession {
  checkoutId: string;
  studentId: number;
  parentId?: number;
  enrollments: Array<{
    enrollmentId: number;
    classId: number;
    className: string;
  }>;
  invoices: Array<{
    invoiceId: number;
    invoiceNumber: string;
    amount: number;
    currency: string;
  }>;
  total: number;
  currency: string;
}

export interface CreateCheckoutDto {
  cartId?: number;
  // For new users
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  // For existing users
  studentId?: number;
}

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly cartService: CartService,
    private readonly studentsService: StudentsService,
    private readonly parentsService: ParentsService,
    private readonly invoicesService: InvoicesService,
    private readonly classesService: ClassesService,
    private readonly enrollmentRepository: StudentClassEnrollmentRepository,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create checkout session - creates accounts, enrollments, and invoices
   */
  async createCheckout(
    dto: CreateCheckoutDto,
    userId?: number,
    sessionId?: string,
    currency: string = 'USD',
  ): Promise<CheckoutSession> {
    // Get cart
    const cart = await this.cartService.getCart(userId, sessionId, currency);

    if (!cart.items || cart.items.length === 0) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          cart: 'Cart is empty',
        },
      });
    }

    let studentId: number;
    let parentId: number | undefined;

    // Handle student creation/retrieval
    if (dto.studentId) {
      // Existing student
      const student = await this.studentsService.findById(dto.studentId);
      if (!student) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            studentId: 'Student not found',
          },
        });
      }
      studentId = student.id;
    } else if (dto.studentEmail) {
      // Check if student exists by email
      const existingStudent = await this.studentsService.findByEmail(
        dto.studentEmail,
      );
      if (existingStudent) {
        studentId = existingStudent.id;
      } else {
        // Create new student
        const studentResult = await this.studentsService.create({
          name: dto.studentName || 'Student',
          email: dto.studentEmail,
          contact: dto.studentPhone,
          country: currency === 'PKR' ? 'Pakistan' : 'United States',
        } as any);
        studentId = studentResult.student.id;
      }
    } else if (userId) {
      // Try to find student by user ID
      const student = await this.studentsService.findByUserId(userId);
      if (!student) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'Student profile not found for user',
          },
        });
      }
      studentId = student.id;
    } else {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          student: 'Student information required',
        },
      });
    }

    // Handle parent creation if provided
    if (dto.parentEmail) {
      const existingParent = await this.parentsService.findByEmail(
        dto.parentEmail,
      );
      if (existingParent) {
        parentId = existingParent.id;
      } else {
        const parentResult = await this.parentsService.create({
          fullName: dto.parentName || dto.parentEmail,
          email: dto.parentEmail,
          phone: dto.parentPhone,
        } as any);
        parentId = parentResult.parent.id;
        // Link student to parent
        if (parentId && studentId) {
          await this.parentsService.linkStudent(parentId, studentId);
        }
      }
    }

    // Create enrollments and invoices
    const enrollments: CheckoutSession['enrollments'] = [];
    const invoices: CheckoutSession['invoices'] = [];

    for (const cartItem of cart.items) {
      // Check if already enrolled
      const existingEnrollment =
        await this.enrollmentRepository.findByStudentAndClass(
          studentId,
          cartItem.classId,
        );

      if (existingEnrollment) {
        // Skip if already enrolled
        this.logger.warn(
          `Student ${studentId} already enrolled in class ${cartItem.classId}`,
        );
        continue;
      }

      // Create enrollment with pending_payment status
      const enrollment = await this.enrollmentRepository.create({
        studentId,
        classId: cartItem.classId,
        enrollmentDate: new Date(),
        status: 'pending_payment' as any, // Will need to update enum
      });

      enrollments.push({
        enrollmentId: enrollment.id,
        classId: cartItem.classId,
        className: cartItem.className,
      });

      // Get class details for invoice
      const classEntity = await this.classesService.findById(cartItem.classId);
      if (!classEntity) {
        throw new Error(`Class ${cartItem.classId} not found`);
      }

      // Calculate discount information
      const originalPrice =
        cartItem.currency === 'PKR' ? classEntity.feePKR : classEntity.feeUSD;
      const discountAmount =
        originalPrice > cartItem.price ? originalPrice - cartItem.price : 0;
      const discountType = discountAmount > 0 ? 'manual' : undefined;

      // Create invoice
      const invoice = await this.invoicesService.create({
        studentId,
        parentId,
        amount: cartItem.price,
        currency: cartItem.currency,
        status: InvoiceStatus.DRAFT,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        description: `Course enrollment: ${cartItem.className}`,
        notes: 'Payment required to activate course access',
        originalPrice: discountAmount > 0 ? originalPrice : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        discountType,
        classId: cartItem.classId,
        items: [
          {
            description: cartItem.className,
            quantity: 1,
            unitPrice: cartItem.price,
            total: cartItem.price,
          },
        ],
      });

      invoices.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
      });
    }

    // Clear cart after checkout
    await this.cartService.clearCart(userId, sessionId);

    // Generate checkout ID
    const checkoutId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const checkoutSession = {
      checkoutId,
      studentId,
      parentId,
      enrollments,
      invoices,
      total: cart.total,
      currency: cart.currency,
    };

    // Send email notification for guest checkout (when studentEmail is provided and no userId)
    if (dto.studentEmail && !userId) {
      try {
        const student = await this.studentsService.findById(studentId);
        if (student && student.email) {
          await this.notificationService.sendGuestCheckoutNotification({
            to: student.email,
            studentName: dto.studentName || student.name || 'Student',
            studentEmail: student.email,
            checkoutId,
            courses: enrollments.map((e) => ({ name: e.className })),
            invoices: invoices.map((inv) => ({
              invoiceNumber: inv.invoiceNumber,
              amount: inv.amount,
              currency: inv.currency,
            })),
            total: cart.total,
            currency: cart.currency,
          });
          this.logger.log(`Guest checkout email sent to ${student.email}`);
        }
      } catch (error) {
        this.logger.error('Error sending guest checkout email:', error);
        // Don't fail checkout if email fails
      }
    }

    return checkoutSession;
  }

  /**
   * Complete checkout after payment
   */
  async completeCheckout(
    checkoutId: string,
    transactionId?: string,
  ): Promise<{ success: boolean; message: string }> {
    // This will be called after payment is verified
    // The payment verification process will activate enrollments
    // This is mainly for tracking/logging
    this.logger.log(
      `Checkout ${checkoutId} completed with transaction ${transactionId}`,
    );
    return {
      success: true,
      message: 'Checkout completed successfully',
    };
  }
}
