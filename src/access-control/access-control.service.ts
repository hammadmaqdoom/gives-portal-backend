import { Injectable, Logger } from '@nestjs/common';
import { StudentsService } from '../students/students.service';
import { InvoicesService } from '../invoices/invoices.service';
import { ClassesService } from '../classes/classes.service';
import { StudentClassEnrollmentRepository } from '../students/infrastructure/persistence/relational/repositories/student-class-enrollment.repository';
import { InvoiceStatus } from '../invoices/domain/invoice';

export interface PaymentStatus {
  hasAccess: boolean;
  isPaid: boolean;
  enrollmentStatus: string;
  invoiceStatus?: string;
  invoiceId?: number;
  requiresPayment: boolean;
  message?: string;
}

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);

  constructor(
    private readonly studentsService: StudentsService,
    private readonly invoicesService: InvoicesService,
    private readonly classesService: ClassesService,
    private readonly enrollmentRepository: StudentClassEnrollmentRepository,
  ) {}

  /**
   * Check if student has access to a course
   */
  async checkCourseAccess(
    studentId: number,
    classId: number,
  ): Promise<PaymentStatus> {
    // Find enrollment
    const enrollment = await this.enrollmentRepository.findByStudentAndClass(
      studentId,
      classId,
    );

    if (!enrollment) {
      return {
        hasAccess: false,
        isPaid: false,
        enrollmentStatus: 'not_enrolled',
        requiresPayment: true,
        message: 'Not enrolled in this course',
      };
    }

    // Check if admin has granted access (bypasses payment requirement)
    if (enrollment.adminGrantedAccess) {
      const paymentStatus = await this.getPaymentStatus(studentId, classId);
      return {
        hasAccess: true,
        isPaid: paymentStatus.isPaid,
        enrollmentStatus: enrollment.status,
        invoiceStatus: paymentStatus.invoiceStatus,
        invoiceId: paymentStatus.invoiceId,
        requiresPayment: false,
        message: 'Access granted by administrator',
      };
    }

    // Check enrollment status
    if (enrollment.status === 'active') {
      // Active enrollment - check if payment is required
      const paymentStatus = await this.getPaymentStatus(studentId, classId);
      if (paymentStatus.isPaid) {
        return {
          hasAccess: true,
          isPaid: true,
          enrollmentStatus: enrollment.status,
          invoiceStatus: paymentStatus.invoiceStatus,
          invoiceId: paymentStatus.invoiceId,
          requiresPayment: false,
        };
      }
    }

    // Check if enrollment is pending payment
    if (enrollment.status === 'pending_payment' as any) {
      const paymentStatus = await this.getPaymentStatus(studentId, classId);
      return {
        hasAccess: false,
        isPaid: false,
        enrollmentStatus: enrollment.status,
        invoiceStatus: paymentStatus.invoiceStatus,
        invoiceId: paymentStatus.invoiceId,
        requiresPayment: true,
        message: 'Payment required to access this course',
      };
    }

    // Other statuses (inactive, completed, dropped)
    return {
      hasAccess: false,
      isPaid: false,
      enrollmentStatus: enrollment.status,
      requiresPayment: enrollment.status === 'inactive',
      message: `Enrollment status: ${enrollment.status}`,
    };
  }

  /**
   * Get payment status for a course
   */
  async getPaymentStatus(
    studentId: number,
    classId: number,
  ): Promise<{
    isPaid: boolean;
    invoiceStatus?: string;
    invoiceId?: number;
  }> {
    // Find invoices for this student and class
    const invoices = await this.invoicesService.findByStudent(studentId);

    // Get class to check fee amount
    const classEntity = await this.classesService.findById(classId);
    if (!classEntity) {
      return { isPaid: false };
    }

    // Find invoice related to this class (by description containing class name)
    // Check for paid invoices
    const paidInvoice = invoices.find(
      (inv) =>
        inv.status === InvoiceStatus.PAID &&
        (inv.description?.includes(classEntity.name) ||
          inv.description?.includes(`Course enrollment: ${classEntity.name}`)),
    );

    if (paidInvoice) {
      return {
        isPaid: true,
        invoiceStatus: paidInvoice.status,
        invoiceId: paidInvoice.id,
      };
    }

    // Check for unpaid invoices
    const unpaidInvoice = invoices.find(
      (inv) =>
        (inv.status === InvoiceStatus.DRAFT ||
          inv.status === InvoiceStatus.SENT) &&
        (inv.description?.includes(classEntity.name) ||
          inv.description?.includes(`Course enrollment: ${classEntity.name}`)),
    );

    return {
      isPaid: false,
      invoiceStatus: unpaidInvoice?.status,
      invoiceId: unpaidInvoice?.id,
    };
  }

  /**
   * Activate enrollment after payment verification
   */
  async activateEnrollment(
    studentId: number,
    classId: number,
  ): Promise<{ success: boolean; message: string }> {
    const enrollment = await this.enrollmentRepository.findByStudentAndClass(
      studentId,
      classId,
    );

    if (!enrollment) {
      return {
        success: false,
        message: 'Enrollment not found',
      };
    }

    // Update enrollment status to active
    await this.enrollmentRepository.update(enrollment.id, {
      status: 'active' as any,
    });

    this.logger.log(
      `Activated enrollment for student ${studentId} in class ${classId}`,
    );

    return {
      success: true,
      message: 'Enrollment activated successfully',
    };
  }

  /**
   * Toggle admin-granted access for a student course enrollment
   * This allows admins to grant access even if payment is not completed
   */
  async toggleAdminGrantedAccess(
    studentId: number,
    classId: number,
    enabled: boolean,
  ): Promise<{ success: boolean; message: string; enrollment?: any }> {
    const enrollment = await this.enrollmentRepository.findByStudentAndClass(
      studentId,
      classId,
    );

    if (!enrollment) {
      return {
        success: false,
        message: 'Enrollment not found',
      };
    }

    // Update admin granted access
    const updatedEnrollment = await this.enrollmentRepository.update(
      enrollment.id,
      {
        adminGrantedAccess: enabled,
      },
    );

    this.logger.log(
      `Admin ${enabled ? 'granted' : 'revoked'} access for student ${studentId} in class ${classId}`,
    );

    return {
      success: true,
      message: enabled
        ? 'Access granted by administrator'
        : 'Admin-granted access revoked',
      enrollment: updatedEnrollment,
    };
  }
}

