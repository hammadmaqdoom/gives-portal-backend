import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { InvoiceRepositoryImpl } from './infrastructure/persistence/relational/repositories/invoice.repository';
import { Invoice } from './domain/invoice';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { FilterInvoiceDto, SortInvoiceDto } from './dto/query-invoice.dto';
import { StudentsService } from '../students/students.service';
import { ParentsService } from '../parents/parents.service';
import { NotificationService } from '../notifications/notification.service';
import { InvoiceStatus } from './domain/invoice';
import { jsPDF } from 'jspdf';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoiceRepository: InvoiceRepositoryImpl,
    @Inject(forwardRef(() => StudentsService))
    private readonly studentsService: StudentsService,
    @Inject(forwardRef(() => ParentsService))
    private readonly parentsService: ParentsService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // Validate student exists
    const student = await this.studentsService.findById(
      createInvoiceDto.studentId,
    );
    if (!student) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          studentId: 'studentNotFound',
        },
      });
    }

    // Validate parent exists if provided
    let parent: any = null;
    if (createInvoiceDto.parentId) {
      parent = await this.parentsService.findById(createInvoiceDto.parentId);
      if (!parent) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            parentId: 'parentNotFound',
          },
        });
      }
    }

    // Retry logic to handle duplicate invoice number race conditions
    const maxRetries = 5;
    let retryCount = 0;
    let lastError: any;

    while (retryCount < maxRetries) {
      try {
        // Generate invoice number if not provided
        const invoiceNumber =
          createInvoiceDto.invoiceNumber ||
          (await this.invoiceRepository.generateInvoiceNumber());

        const invoiceData: Partial<Invoice> = {
          invoiceNumber,
          studentId: student.id,
          studentName: student.name,
          parentId: parent?.id,
          parentName: parent?.fullName,
          amount: createInvoiceDto.amount,
          currency: createInvoiceDto.currency,
          status: createInvoiceDto.status,
          dueDate: new Date(createInvoiceDto.dueDate),
          generatedDate: new Date(),
          description: createInvoiceDto.description,
          notes: createInvoiceDto.notes,
          originalPrice: createInvoiceDto.originalPrice,
          discountAmount: createInvoiceDto.discountAmount,
          discountType: createInvoiceDto.discountType,
          classId: createInvoiceDto.classId,
          items:
            createInvoiceDto.items?.map((item) => ({
              id: 0, // Will be set by database
              invoiceId: 0, // Will be set by database
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              createdAt: new Date(),
              updatedAt: new Date(),
            })) || [],
        };

        const invoice = await this.invoiceRepository.create(invoiceData);

        // Send invoice notification email
        try {
          await this.sendInvoiceNotification(invoice);
        } catch (error) {
          console.error('Error sending invoice notification:', error);
          // Don't fail the invoice creation if notification fails
        }

        return invoice;
      } catch (error: any) {
        // Check if it's a duplicate key error (PostgreSQL error code 23505)
        // Check multiple possible error structures
        const errorCode = error?.code || error?.driverError?.code;
        const errorConstraint = error?.constraint || error?.driverError?.constraint;
        const errorMessage = error?.message || error?.driverError?.message || '';
        
        const isDuplicateKeyError =
          (error instanceof QueryFailedError || error?.name === 'QueryFailedError') &&
          errorCode === '23505' &&
          (errorConstraint === 'invoice_invoiceNumber_key' || 
           errorMessage.toLowerCase().includes('invoice_invoicenumber_key') ||
           errorMessage.toLowerCase().includes('duplicate key value violates unique constraint'));

        if (isDuplicateKeyError && retryCount < maxRetries - 1) {
          // If invoice number was provided, we need to generate a new one
          if (createInvoiceDto.invoiceNumber) {
            // Clear the provided invoice number so a new one will be generated
            createInvoiceDto.invoiceNumber = undefined;
          }
          retryCount++;
          lastError = error;
          console.warn(`Duplicate invoice number detected, retrying with new number (attempt ${retryCount + 1}/${maxRetries})`);
          // Add a small delay before retrying to reduce contention
          await new Promise((resolve) => setTimeout(resolve, 50 * retryCount));
          continue;
        }

        // If it's not a duplicate key error or we've exhausted retries, throw
        throw error;
      }
    }

    // If we've exhausted all retries, throw the last error
    throw new UnprocessableEntityException({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'Failed to create invoice after multiple attempts due to duplicate invoice number',
      errors: {
        invoiceNumber: 'duplicateInvoiceNumber',
      },
    });
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterInvoiceDto | null;
    sortOptions?: SortInvoiceDto[] | null;
    paginationOptions: {
      page: number;
      limit: number;
    };
  }): Promise<Invoice[]> {
    return this.invoiceRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: number): Promise<Invoice | null> {
    return this.invoiceRepository.findById(id);
  }

  async findByStudent(studentId: number): Promise<Invoice[]> {
    return this.invoiceRepository.findByStudent(studentId);
  }

  async findByStudentUserId(userId: number): Promise<Invoice[]> {
    console.log(
      '🔍 findByStudentUserId - Looking for student with user ID:',
      userId,
    );

    // First find the student by user ID
    const student = await this.studentsService.findByUserId(userId);
    console.log('🔍 findByStudentUserId - Found student:', student);

    if (!student) {
      console.log(
        '🔍 findByStudentUserId - No student found, returning empty array',
      );
      return [];
    }

    // Then get invoices for that student
    console.log(
      '🔍 findByStudentUserId - Getting invoices for student ID:',
      student.id,
    );
    const invoices = await this.invoiceRepository.findByStudent(student.id);
    console.log('🔍 findByStudentUserId - Found invoices:', invoices);

    return invoices;
  }

  async findByParent(parentId: number): Promise<Invoice[]> {
    return this.invoiceRepository.findByParent(parentId);
  }

  async findByParentUserId(userId: number): Promise<Invoice[]> {
    // First find the parent by user ID
    const parent = await this.parentsService.findByUserId(userId);
    if (!parent) {
      return [];
    }
    // Then get invoices for that parent
    return this.invoiceRepository.findByParent(parent.id);
  }

  async findByStatus(status: string): Promise<Invoice[]> {
    return this.invoiceRepository.findByStatus(status);
  }

  // Attach proof URL to the latest unpaid invoice for a student
  async attachProofToLatestUnpaidInvoice(studentId: number, proofUrl: string) {
    const invoices = await this.invoiceRepository.findByStudent(studentId);
    const latestUnpaid = (invoices || [])
      .filter((i) => i.status !== 'paid')
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
    if (!latestUnpaid) return null;
    return this.invoiceRepository.update(latestUnpaid.id, {
      paymentProofUrl: proofUrl,
    } as any);
  }

  async findOverdue(): Promise<Invoice[]> {
    return this.invoiceRepository.findOverdue();
  }

  async update(
    id: number,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice | null> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const updateData: Partial<Invoice> = {};

    // Handle each field individually to ensure proper type conversion
    if (updateInvoiceDto.status !== undefined) {
      updateData.status = updateInvoiceDto.status;
    }
    if (updateInvoiceDto.paidDate) {
      updateData.paidDate = new Date(updateInvoiceDto.paidDate);
    }
    if (updateInvoiceDto.paymentMethod !== undefined) {
      updateData.paymentMethod = updateInvoiceDto.paymentMethod;
    }
    if (updateInvoiceDto.transactionId !== undefined) {
      updateData.transactionId = updateInvoiceDto.transactionId;
    }
    if (updateInvoiceDto.paymentProofUrl !== undefined) {
      updateData.paymentProofUrl = updateInvoiceDto.paymentProofUrl;
    }
    if (updateInvoiceDto.invoiceNumber !== undefined) {
      updateData.invoiceNumber = updateInvoiceDto.invoiceNumber;
    }
    if (updateInvoiceDto.studentId !== undefined) {
      updateData.studentId = updateInvoiceDto.studentId;
    }
    if (updateInvoiceDto.parentId !== undefined) {
      updateData.parentId = updateInvoiceDto.parentId;
    }
    if (updateInvoiceDto.amount !== undefined) {
      updateData.amount = updateInvoiceDto.amount;
    }
    if (updateInvoiceDto.currency !== undefined) {
      updateData.currency = updateInvoiceDto.currency;
    }
    if (updateInvoiceDto.dueDate) {
      updateData.dueDate = new Date(updateInvoiceDto.dueDate);
    }
    if (updateInvoiceDto.description !== undefined) {
      updateData.description = updateInvoiceDto.description;
    }
    if (updateInvoiceDto.notes !== undefined) {
      updateData.notes = updateInvoiceDto.notes;
    }

    return this.invoiceRepository.update(id, updateData);
  }

  async markAsPaid(
    id: number,
    paymentMethod: string,
    transactionId?: string,
  ): Promise<Invoice | null> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const updateData: Partial<Invoice> = {
      status: InvoiceStatus.PAID,
      paidDate: new Date(),
      paymentMethod: paymentMethod as any,
      transactionId,
    };

    return this.invoiceRepository.update(id, updateData);
  }

  async uploadPaymentProof(
    id: number,
    paymentProofUrl: string,
  ): Promise<Invoice | null> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.invoiceRepository.update(id, { paymentProofUrl });
  }

  async uploadPaymentProofFile(
    id: number,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<Invoice | null> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const filename = `payment-proof-${id}-${timestamp}.${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = 'uploads/payment-proofs';
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save file to uploads directory
    const filePath = `${uploadsDir}/${filename}`;
    fs.writeFileSync(filePath, file.buffer);

    // Generate URL for the uploaded file
    const paymentProofUrl = `/api/v1/files/serve/payment-proofs/${filename}`;

    return this.invoiceRepository.update(id, { paymentProofUrl });
  }

  async remove(id: number): Promise<void> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.invoiceRepository.remove(id);
  }

  async removeMany(ids: number[]): Promise<{ deleted: number; failed: number }> {
    let deleted = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const invoice = await this.invoiceRepository.findById(id);
        if (invoice) {
          await this.invoiceRepository.remove(id);
          deleted++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error deleting invoice ${id}:`, error);
        failed++;
      }
    }

    return { deleted, failed };
  }

  async generateInvoiceNumber(): Promise<string> {
    return this.invoiceRepository.generateInvoiceNumber();
  }

  async getInvoiceStats(): Promise<{
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  }> {
    const allInvoices = await this.invoiceRepository.findManyWithPagination({
      filterOptions: null,
      sortOptions: null,
      paginationOptions: { page: 1, limit: 1000 },
    });

    const stats = {
      total: allInvoices.length,
      paid: 0,
      pending: 0,
      overdue: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };

    const today = new Date();

    allInvoices.forEach((invoice) => {
      stats.totalAmount += invoice.amount;

      switch (invoice.status) {
        case InvoiceStatus.PAID:
          stats.paid++;
          stats.paidAmount += invoice.amount;
          break;
        case InvoiceStatus.SENT:
        case InvoiceStatus.DRAFT:
          if (invoice.dueDate < today) {
            stats.overdue++;
          } else {
            stats.pending++;
            stats.pendingAmount += invoice.amount;
          }
          break;
      }
    });

    return stats;
  }

  async generatePDF(invoiceId: number): Promise<Buffer> {
    const invoice = await this.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Get student details
    const student = await this.studentsService.findById(invoice.studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get parent details
    let parent: any = null;
    if (invoice.parentId) {
      parent = await this.parentsService.findById(invoice.parentId);
    }

    // If no parent found, try to get parents from student
    if (!parent) {
      const parents = await this.parentsService.findByStudentId(
        invoice.studentId,
      );
      parent = parents && parents.length > 0 ? parents[0] : null;
    }

    // Get company settings
    const settings = await this.settingsService.getSettingsOrCreate();
    const businessInfo = await this.settingsService.getBusinessInfo();
    const bankDetails = await this.settingsService.getBankDetails();

    // Get active payment gateways
    const activeGateways = await this.paymentsService.getActiveGateways();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Helper function to add text with word wrapping
    const addTextWithWrap = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      fontSize: number = 12,
      fontStyle: string = 'normal',
    ) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + lines.length * (fontSize * 0.4);
    };

    // Helper function to draw a line
    const drawLine = (y: number) => {
      doc.setLineWidth(0.5);
      doc.line(20, y, pageWidth - 20, y);
    };

    // Header Section with Company Logo and Info
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, pageWidth, 60, 'F');

    // Company Logo (if available)
    if (settings.logoNavbar) {
      try {
        // Try to add logo if it's a base64 image
        if (settings.logoNavbar.startsWith('data:image/')) {
          doc.addImage(settings.logoNavbar, 'PNG', 20, 10, 40, 40);
        }
      } catch (error) {
        // If logo fails to load, continue without it
        console.warn('Failed to load company logo:', error);
      }
    }

    // Company Information
    const companyX = settings.logoNavbar ? 70 : 20;
    yPosition = 15;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.appName || 'Company Name', companyX, yPosition);
    yPosition += 8;

    if (businessInfo.companyLegalName) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(businessInfo.companyLegalName, companyX, yPosition);
      yPosition += 6;
    }

    if (businessInfo.businessAddress) {
      yPosition = addTextWithWrap(
        businessInfo.businessAddress,
        companyX,
        yPosition,
        80,
        10,
      );
    }

    // Contact Information
    if (businessInfo.contactPhone) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Phone: ${businessInfo.contactPhone}`, companyX, yPosition);
      yPosition += 5;
    }

    if (businessInfo.contactEmail) {
      doc.text(`Email: ${businessInfo.contactEmail}`, companyX, yPosition);
      yPosition += 5;
    }

    if (businessInfo.contactWebsite) {
      doc.text(`Website: ${businessInfo.contactWebsite}`, companyX, yPosition);
      yPosition += 5;
    }

    // Tax Information
    if (businessInfo.taxRegistrationNumber) {
      const taxLabel = businessInfo.taxRegistrationLabel || 'Tax ID';
      doc.text(
        `${taxLabel}: ${businessInfo.taxRegistrationNumber}`,
        companyX,
        yPosition,
      );
      yPosition += 5;
    }

    if (businessInfo.companyNumber) {
      doc.text(`Company #: ${businessInfo.companyNumber}`, companyX, yPosition);
    }

    // Invoice Header (Right side)
    const invoiceHeaderX = pageWidth - 80;
    yPosition = 15;

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', invoiceHeaderX, yPosition);
    yPosition += 12;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, invoiceHeaderX, yPosition);
    yPosition += 6;
    doc.text(
      `Date: ${new Date(invoice.generatedDate).toLocaleDateString()}`,
      invoiceHeaderX,
      yPosition,
    );
    yPosition += 6;
    doc.text(
      `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
      invoiceHeaderX,
      yPosition,
    );
    yPosition += 6;
    doc.text(
      `Status: ${invoice.status.toUpperCase()}`,
      invoiceHeaderX,
      yPosition,
    );

    yPosition = 70;

    // Bill To Section
    doc.setFillColor(248, 249, 250);
    doc.rect(20, yPosition, pageWidth - 40, 50, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 25, yPosition + 10);

    yPosition += 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    if (parent) {
      doc.text(parent.fullName || 'Parent', 25, yPosition);
      yPosition += 6;
      if (parent.email) {
        doc.text(parent.email, 25, yPosition);
        yPosition += 6;
      }
      if (parent.phone) {
        doc.text(parent.phone, 25, yPosition);
        yPosition += 6;
      }
    }
    doc.text(`Student: ${student.name}`, 25, yPosition);
    yPosition += 6;
    if (student.email) {
      doc.text(`Student Email: ${student.email}`, 25, yPosition);
    }

    yPosition += 40;

    // Invoice Items Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details', 20, yPosition);
    yPosition += 10;

    // Table Header
    doc.setFillColor(52, 58, 64);
    doc.rect(20, yPosition, pageWidth - 40, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 25, yPosition + 10);
    doc.text('Amount', pageWidth - 60, yPosition + 10);

    yPosition += 20;
    doc.setTextColor(0, 0, 0);

    // Invoice Item
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const descriptionLines = doc.splitTextToSize(
      invoice.description,
      pageWidth - 100,
    );
    const itemHeight = Math.max(15, descriptionLines.length * 5);

    doc.rect(20, yPosition, pageWidth - 40, itemHeight);
    doc.text(descriptionLines, 25, yPosition + 8);
    doc.text(
      `${invoice.currency} ${invoice.amount.toFixed(2)}`,
      pageWidth - 60,
      yPosition + 8,
    );

    yPosition += itemHeight + 10;

    // Total Section
    const totalX = pageWidth - 100;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Total Amount: ${invoice.currency} ${invoice.amount.toFixed(2)}`,
      totalX,
      yPosition,
    );

    yPosition += 30;

    // Payment Information Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information', 20, yPosition);
    yPosition += 15;

    // Bank Transfer Details
    if (bankDetails.bankName) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bank Transfer Details:', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      if (bankDetails.bankName) {
        doc.text(`Bank Name: ${bankDetails.bankName}`, 20, yPosition);
        yPosition += 6;
      }
      if (bankDetails.bankAccountTitle) {
        doc.text(
          `Account Title: ${bankDetails.bankAccountTitle}`,
          20,
          yPosition,
        );
        yPosition += 6;
      }
      if (bankDetails.bankAccountNumber) {
        doc.text(
          `Account Number: ${bankDetails.bankAccountNumber}`,
          20,
          yPosition,
        );
        yPosition += 6;
      }
      if (bankDetails.bankIban) {
        doc.text(`IBAN: ${bankDetails.bankIban}`, 20, yPosition);
        yPosition += 6;
      }
      if (bankDetails.bankSwiftCode) {
        doc.text(`SWIFT Code: ${bankDetails.bankSwiftCode}`, 20, yPosition);
        yPosition += 6;
      }
      if (bankDetails.bankAccountCurrency) {
        doc.text(`Currency: ${bankDetails.bankAccountCurrency}`, 20, yPosition);
        yPosition += 6;
      }

      yPosition += 10;
    }

    // Online Payment Options
    if (activeGateways && activeGateways.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Online Payment Options:', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      activeGateways.forEach((gateway) => {
        if (gateway.name !== 'bank_transfer') {
          // Exclude bank transfer from online options
          doc.text(`• ${gateway.displayName}`, 25, yPosition);
          if (gateway.description) {
            yPosition += 5;
            doc.setFontSize(10);
            doc.text(`  ${gateway.description}`, 25, yPosition);
            doc.setFontSize(11);
          }
          yPosition += 8;
        }
      });

      yPosition += 10;
    }

    // Notes Section
    if (invoice.notes) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      yPosition = addTextWithWrap(invoice.notes, 20, yPosition, pageWidth - 40);
      yPosition += 10;
    }

    // Footer
    const footerY = pageHeight - 40;
    drawLine(footerY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 20, footerY + 10);

    if (businessInfo.contactEmail) {
      doc.text(
        `For any queries, please contact us at ${businessInfo.contactEmail}`,
        20,
        footerY + 20,
      );
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  async sendInvoiceEmail(invoiceId: number): Promise<{ message: string }> {
    const invoice = await this.findById(invoiceId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Get student details
    const student = await this.studentsService.findById(invoice.studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get parent details
    let parent: any = null;
    if (invoice.parentId) {
      parent = await this.parentsService.findById(invoice.parentId);
    }

    // If no parent found, try to get parents from student
    if (!parent) {
      const parents = await this.parentsService.findByStudentId(
        invoice.studentId,
      );
      parent = parents && parents.length > 0 ? parents[0] : null;
    }

    // Collect email recipients
    const recipients: string[] = [];

    // Add student email if available
    if (student.email) {
      recipients.push(student.email);
    }

    // Add parent email if available
    if (parent && parent.email) {
      recipients.push(parent.email);
    }

    if (recipients.length === 0) {
      throw new UnprocessableEntityException(
        'No email addresses found for student or parent',
      );
    }

    // Generate PDF
    const pdfBuffer = await this.generatePDF(invoiceId);

    // Send email to all recipients
    const emailPromises = recipients.map((recipient) =>
      this.mailService.sendInvoiceEmail({
        to: recipient,
        parentName: parent?.fullName || 'Parent',
        studentName: student.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: `${invoice.currency} ${invoice.amount.toFixed(2)}`,
        dueDate: new Date(invoice.dueDate).toLocaleDateString(),
        description: invoice.description,
        pdfBuffer,
      }),
    );

    await Promise.all(emailPromises);

    const recipientList = recipients.join(', ');
    return {
      message: `Invoice sent successfully via email to: ${recipientList}`,
    };
  }

  private async sendInvoiceNotification(invoice: Invoice): Promise<void> {
    try {
      // Get student details
      const student = await this.studentsService.findById(invoice.studentId);
      if (!student) return;

      // Get parent details
      let parent: any = null;
      if (invoice.parentId) {
        parent = await this.parentsService.findById(invoice.parentId);
      }

      // If no parent found, try to get parents from student
      if (!parent) {
        const parents = await this.parentsService.findByStudentId(
          invoice.studentId,
        );
        parent = parents && parents.length > 0 ? parents[0] : null;
      }

      if (!parent || !parent.email) return;

      // Format amount
      const formattedAmount = `${invoice.amount} ${invoice.currency}`;

      // Format due date
      const dueDate = new Date(invoice.dueDate).toLocaleDateString();

      await this.notificationService.sendInvoiceGeneratedNotification({
        to: parent.email,
        parentName: parent.fullName,
        studentName: student.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: formattedAmount,
        dueDate,
        description: invoice.description,
        invoiceId: invoice.id,
      });
    } catch (error) {
      console.error('Error sending invoice notification:', error);
    }
  }
}
