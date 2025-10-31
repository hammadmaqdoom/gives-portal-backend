import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoicesService } from '../invoices/invoices.service';
import { StudentsService } from '../students/students.service';
import { ClassesService } from '../classes/classes.service';
import { ParentsService } from '../parents/parents.service';
import { InvoiceGenerationLogEntity } from './infrastructure/persistence/relational/entities/invoice-generation-log.entity';
import { InvoiceStatus } from '../invoices/domain/invoice';

export interface InvoiceGenerationLog {
  id?: number;
  studentId: number;
  classId: number;
  invoiceId?: number;
  generationType: 'monthly' | 'quarterly' | 'yearly' | 'manual';
  status: 'success' | 'failed' | 'skipped';
  reason?: string;
  amount: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeeCycle {
  type: 'monthly' | 'quarterly' | 'yearly';
  dayOfMonth?: number; // For monthly cycles
  dayOfQuarter?: number; // For quarterly cycles
  dayOfYear?: number; // For yearly cycles
  startDate: Date;
}

@Injectable()
export class InvoiceGenerationService {
  private readonly logger = new Logger(InvoiceGenerationService.name);

  constructor(
    @InjectRepository(InvoiceGenerationLogEntity)
    private readonly invoiceGenerationLogRepository: Repository<InvoiceGenerationLogEntity>,
    private readonly invoicesService: InvoicesService,
    private readonly studentsService: StudentsService,
    private readonly classesService: ClassesService,
    private readonly parentsService: ParentsService,
  ) {}

  // Run daily at 2 AM to check for invoice generation needs
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkAndGenerateInvoices() {
    this.logger.log('Starting daily invoice generation check...');
    
    try {
      // Get all active enrollments
      const activeEnrollments = await this.getActiveEnrollments();
      this.logger.log(`Found ${activeEnrollments.length} active enrollments`);

      for (const enrollment of activeEnrollments) {
        await this.processEnrollmentForInvoiceGeneration(enrollment);
      }

      this.logger.log('Invoice generation check completed');
    } catch (error) {
      this.logger.error('Error during invoice generation check:', error);
    }
  }

  private async getActiveEnrollments(): Promise<any[]> {
    // This would need to be implemented to get active enrollments
    // For now, we'll return an empty array
    return [];
  }

  private async processEnrollmentForInvoiceGeneration(enrollment: any): Promise<void> {
    try {
      const { studentId, classId, enrollmentDate, status } = enrollment;
      
      if (status !== 'active') {
        return;
      }

      // Get class details to determine fee cycle
      const classDetails = await this.classesService.findById(classId);
      if (!classDetails) {
        this.logger.warn(`Class ${classId} not found for enrollment`);
        return;
      }

      // Determine fee cycle (default to monthly)
      const feeCycle = this.determineFeeCycle(classDetails);
      
      // Check if invoice should be generated based on enrollment date and fee cycle
      const shouldGenerate = await this.shouldGenerateInvoice(
        studentId,
        classId,
        enrollmentDate,
        feeCycle
      );

      if (shouldGenerate) {
        await this.generateInvoiceForEnrollment(studentId, classId, feeCycle);
      }

    } catch (error) {
      this.logger.error(`Error processing enrollment for invoice generation:`, error);
    }
  }

  private determineFeeCycle(classDetails: any): FeeCycle {
    // Default to monthly cycle
    // This could be enhanced to read from class configuration
    return {
      type: 'monthly',
      dayOfMonth: 1, // Generate on 1st of each month
      startDate: new Date(),
    };
  }

  private async shouldGenerateInvoice(
    studentId: number,
    classId: number,
    enrollmentDate: Date,
    feeCycle: FeeCycle
  ): Promise<boolean> {
    try {
      // Get existing invoices for this student and class
      const existingInvoices = await this.invoicesService.findByStudent(studentId);
      
      // Filter invoices for this specific class (if class-specific invoices are supported)
      const classInvoices = existingInvoices.filter(invoice => 
        invoice.description?.includes(`Class ${classId}`) || true // For now, include all invoices
      );

      const now = new Date();
      const enrollment = new Date(enrollmentDate);

      switch (feeCycle.type) {
        case 'monthly':
          return this.shouldGenerateMonthlyInvoice(enrollment, now, classInvoices, feeCycle.dayOfMonth);
        case 'quarterly':
          return this.shouldGenerateQuarterlyInvoice(enrollment, now, classInvoices, feeCycle.dayOfQuarter);
        case 'yearly':
          return this.shouldGenerateYearlyInvoice(enrollment, now, classInvoices, feeCycle.dayOfYear);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Error checking if invoice should be generated:`, error);
      return false;
    }
  }

  private shouldGenerateMonthlyInvoice(
    enrollmentDate: Date,
    currentDate: Date,
    existingInvoices: any[],
    dayOfMonth: number = 1
  ): boolean {
    // Check if we're past the enrollment date
    if (currentDate < enrollmentDate) {
      return false;
    }

    // Check if it's the right day of the month
    if (currentDate.getDate() !== dayOfMonth) {
      return false;
    }

    // Check if invoice already exists for this month
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const hasInvoiceForThisMonth = existingInvoices.some(invoice => {
      const invoiceDate = new Date(invoice.generatedDate);
      return invoiceDate.getMonth() === currentMonth && 
             invoiceDate.getFullYear() === currentYear;
    });

    return !hasInvoiceForThisMonth;
  }

  private shouldGenerateQuarterlyInvoice(
    enrollmentDate: Date,
    currentDate: Date,
    existingInvoices: any[],
    dayOfQuarter: number = 1
  ): boolean {
    // Check if we're past the enrollment date
    if (currentDate < enrollmentDate) {
      return false;
    }

    // Check if it's the right day of the quarter
    const quarterStartMonth = Math.floor(currentDate.getMonth() / 3) * 3;
    const quarterStartDate = new Date(currentDate.getFullYear(), quarterStartMonth, dayOfQuarter);
    
    if (currentDate.getTime() !== quarterStartDate.getTime()) {
      return false;
    }

    // Check if invoice already exists for this quarter
    const currentQuarter = Math.floor(currentDate.getMonth() / 3);
    const currentYear = currentDate.getFullYear();
    
    const hasInvoiceForThisQuarter = existingInvoices.some(invoice => {
      const invoiceDate = new Date(invoice.generatedDate);
      const invoiceQuarter = Math.floor(invoiceDate.getMonth() / 3);
      return invoiceQuarter === currentQuarter && 
             invoiceDate.getFullYear() === currentYear;
    });

    return !hasInvoiceForThisQuarter;
  }

  private shouldGenerateYearlyInvoice(
    enrollmentDate: Date,
    currentDate: Date,
    existingInvoices: any[],
    dayOfYear: number = 1
  ): boolean {
    // Check if we're past the enrollment date
    if (currentDate < enrollmentDate) {
      return false;
    }

    // Check if it's the right day of the year
    const yearStartDate = new Date(currentDate.getFullYear(), 0, dayOfYear);
    
    if (currentDate.getTime() !== yearStartDate.getTime()) {
      return false;
    }

    // Check if invoice already exists for this year
    const currentYear = currentDate.getFullYear();
    
    const hasInvoiceForThisYear = existingInvoices.some(invoice => {
      const invoiceDate = new Date(invoice.generatedDate);
      return invoiceDate.getFullYear() === currentYear;
    });

    return !hasInvoiceForThisYear;
  }

  private async generateInvoiceForEnrollment(
    studentId: number,
    classId: number,
    feeCycle: FeeCycle
  ): Promise<any> {
    try {
      // Get student details
      const student = await this.studentsService.findById(studentId);
      if (!student) {
        this.logger.warn(`Student ${studentId} not found`);
        return null;
      }

      // Get class details
      const classDetails = await this.classesService.findById(classId);
      if (!classDetails) {
        this.logger.warn(`Class ${classId} not found`);
        return null;
      }

      // Get parent information
      let parent: any = null;
      const parents = await this.parentsService.findByStudentId(studentId);
      parent = parents && parents.length > 0 ? parents[0] : null;

      // Determine currency based on student's country
      const currency = student.country === 'Pakistan' ? 'PKR' : 'USD';

      // Get the appropriate fee based on currency
      const classFee = currency === 'PKR' ? classDetails.feePKR : classDetails.feeUSD;

      // Calculate period dates
      const { periodStart, periodEnd } = this.calculatePeriodDates(feeCycle);

      // Generate invoice
      const invoice = await this.invoicesService.create({
        invoiceNumber: this.generateInvoiceNumber(),
        studentId,
        parentId: parent?.id,
        amount: classFee,
        currency,
        status: InvoiceStatus.DRAFT,
        dueDate: this.calculateDueDate(periodStart).toISOString(),
        description: this.generateInvoiceDescription(classDetails, feeCycle, periodStart, periodEnd),
        notes: `Auto-generated invoice for ${feeCycle.type} fee cycle`,
        items: [{
          description: `${classDetails.name} - ${feeCycle.type} fee`,
          quantity: 1,
          unitPrice: classFee,
          total: classFee,
        }],
      });

      // Log successful generation
      await this.createGenerationLog({
        studentId,
        classId,
        invoiceId: invoice.id,
        generationType: feeCycle.type,
        status: 'success',
        amount: classFee,
        currency,
        periodStart,
        periodEnd,
      });

      this.logger.log(`Invoice ${invoice.invoiceNumber} generated for student ${studentId}, class ${classId}`);

      return invoice;

    } catch (error) {
      this.logger.error(`Error generating invoice for student ${studentId}, class ${classId}:`, error);
      
      // Log failed generation
      await this.createGenerationLog({
        studentId,
        classId,
        generationType: feeCycle.type,
        status: 'failed',
        reason: error.message,
        amount: 0,
        currency: 'USD',
        periodStart: new Date(),
        periodEnd: new Date(),
      });
    }
  }

  private calculatePeriodDates(feeCycle: FeeCycle): { periodStart: Date; periodEnd: Date } {
    const now = new Date();
    
    switch (feeCycle.type) {
      case 'monthly':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { periodStart: monthStart, periodEnd: monthEnd };
        
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        return { periodStart: quarterStart, periodEnd: quarterEnd };
        
      case 'yearly':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        return { periodStart: yearStart, periodEnd: yearEnd };
        
      default:
        return { periodStart: now, periodEnd: now };
    }
  }

  private calculateDueDate(periodStart: Date): Date {
    // Set due date to 15 days after period start
    const dueDate = new Date(periodStart);
    dueDate.setDate(dueDate.getDate() + 15);
    return dueDate;
  }

  private generateInvoiceDescription(
    classDetails: any,
    feeCycle: FeeCycle,
    periodStart: Date,
    periodEnd: Date
  ): string {
    const periodStr = this.formatPeriodString(periodStart, periodEnd);
    return `${classDetails.name} - ${feeCycle.type} fee for ${periodStr}`;
  }

  private formatPeriodString(start: Date, end: Date): string {
    const startStr = start.toLocaleDateString();
    const endStr = end.toLocaleDateString();
    return `${startStr} to ${endStr}`;
  }

  async createGenerationLog(logData: Partial<InvoiceGenerationLog>): Promise<InvoiceGenerationLogEntity> {
    const generationLog = this.invoiceGenerationLogRepository.create({
      studentId: logData.studentId,
      classId: logData.classId,
      invoiceId: logData.invoiceId,
      generationType: logData.generationType,
      status: logData.status || 'success',
      reason: logData.reason,
      amount: logData.amount,
      currency: logData.currency,
      periodStart: logData.periodStart,
      periodEnd: logData.periodEnd,
    });

    return this.invoiceGenerationLogRepository.save(generationLog);
  }

  async getGenerationLogs(limit: number = 50, offset: number = 0): Promise<InvoiceGenerationLogEntity[]> {
    return this.invoiceGenerationLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getGenerationLogsByStudent(studentId: number): Promise<InvoiceGenerationLogEntity[]> {
    return this.invoiceGenerationLogRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  async getGenerationStats(): Promise<{
    total: number;
    success: number;
    failed: number;
    skipped: number;
    monthly: number;
    quarterly: number;
    yearly: number;
  }> {
    const logs = await this.invoiceGenerationLogRepository.find();
    
    const stats = {
      total: logs.length,
      success: 0,
      failed: 0,
      skipped: 0,
      monthly: 0,
      quarterly: 0,
      yearly: 0,
    };

    logs.forEach(log => {
      switch (log.status) {
        case 'success':
          stats.success++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'skipped':
          stats.skipped++;
          break;
      }

      switch (log.generationType) {
        case 'monthly':
          stats.monthly++;
          break;
        case 'quarterly':
          stats.quarterly++;
          break;
        case 'yearly':
          stats.yearly++;
          break;
      }
    });

    return stats;
  }

  // Manual invoice generation for specific student and class
  async generateManualInvoice(
    studentId: number,
    classId: number,
    feeCycle: FeeCycle
  ): Promise<any> {
    await this.generateInvoiceForEnrollment(studentId, classId, feeCycle);
    return { message: 'Manual invoice generation initiated' };
  }

  // Generate monthly invoices for all active enrollments
  async generateMonthlyInvoices(): Promise<{ success: boolean; message: string; generated: number }> {
    const feeCycle: FeeCycle = {
      type: 'monthly',
      startDate: new Date(),
    };
    
    const result = await this.generateInvoicesForAllEnrollments(feeCycle);
    return {
      success: true,
      message: `Monthly invoices generated successfully`,
      generated: result.generated,
    };
  }

  // Generate quarterly invoices for all active enrollments
  async generateQuarterlyInvoices(): Promise<{ success: boolean; message: string; generated: number }> {
    const feeCycle: FeeCycle = {
      type: 'quarterly',
      startDate: new Date(),
    };
    
    const result = await this.generateInvoicesForAllEnrollments(feeCycle);
    return {
      success: true,
      message: `Quarterly invoices generated successfully`,
      generated: result.generated,
    };
  }

  // Generate yearly invoices for all active enrollments
  async generateYearlyInvoices(): Promise<{ success: boolean; message: string; generated: number }> {
    const feeCycle: FeeCycle = {
      type: 'yearly',
      startDate: new Date(),
    };
    
    const result = await this.generateInvoicesForAllEnrollments(feeCycle);
    return {
      success: true,
      message: `Yearly invoices generated successfully`,
      generated: result.generated,
    };
  }

  // Generate invoice for specific student
  async generateInvoiceForStudent(studentId: number): Promise<{ success: boolean; message: string; invoiceId?: number }> {
    try {
      // Get enrollments for the student through the students service
      const enrollments = await this.studentsService.getEnrollments(studentId);
      
      // Filter only active enrollments
      const activeEnrollments = enrollments.filter(enrollment => enrollment.status === 'active');
      
      if (activeEnrollments.length === 0) {
        return {
          success: false,
          message: 'No active enrollments found for this student',
        };
      }

      let generatedCount = 0;
      let lastInvoiceId: number | undefined;

      for (const enrollment of activeEnrollments) {
        const feeCycle: FeeCycle = {
          type: 'monthly',
          startDate: enrollment.enrollmentDate,
        };

        const result = await this.generateInvoiceForEnrollment(studentId, enrollment.classId, feeCycle);
        if (result) {
          generatedCount++;
          lastInvoiceId = result.id;
        }
      }

      return {
        success: true,
        message: `Generated ${generatedCount} invoice(s) for student`,
        invoiceId: lastInvoiceId,
      };
    } catch (error) {
      console.error('Error generating invoice for student:', error);
      return {
        success: false,
        message: 'Failed to generate invoice for student',
      };
    }
  }

  // Generate invoices for all active enrollments
  private async generateInvoicesForAllEnrollments(feeCycle: FeeCycle): Promise<{ generated: number }> {
    // Get all students through pagination
    const students = await this.studentsService.findManyWithPagination({
      filterOptions: null,
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 }, // Get a large number of students
      includeRelations: true,
    });
    
    let generated = 0;

    for (const student of students) {
      try {
        // Get enrollments for this student
        const enrollments = await this.studentsService.getEnrollments(student.id);
        
        for (const enrollment of enrollments) {
          if (enrollment.status === 'active') {
            await this.generateInvoiceForEnrollment(student.id, enrollment.classId, feeCycle);
            generated++;
          }
        }
      } catch (error) {
        this.logger.error(`Failed to generate invoice for student ${student.id}:`, error);
      }
    }

    return { generated };
  }

  // Generate invoice number
  private generateInvoiceNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
  }
}
