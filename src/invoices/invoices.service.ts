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
import * as fs from 'fs/promises';
import * as path from 'path';
import Handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';

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
    private readonly configService: ConfigService,
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

    // First find the student by user ID, auto-create if doesn't exist
    const student = await this.studentsService.ensureStudentProfileForUser(userId);
    console.log('🔍 findByStudentUserId - Found/created student:', student);

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

    // Read and compile HTML template
    const templatePath = path.join(
      this.configService.getOrThrow('app.workingDirectory', {
        infer: true,
      }),
      'src',
      'invoices',
      'templates',
      'invoice-pdf.hbs',
    );

    const templateContent = await fs.readFile(templatePath, 'utf-8');

    // Register Handlebars helpers
    Handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'USD') => {
      return `${currency} ${Number(amount).toFixed(2)}`;
    });

    Handlebars.registerHelper('mod', (a: number, b: number) => {
      return a % b === 0;
    });

    const template = Handlebars.compile(templateContent);

    // Calculate totals
    let subtotal = invoice.amount;
    if (invoice.items && invoice.items.length > 0) {
      subtotal = invoice.items.reduce((sum, item) => sum + Number(item.total), 0);
    }

    const tax = 0; // Add tax calculation if needed
    const total = subtotal + tax;

    // Format dates
    const formatDate = (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    // Prepare template data
    const templateData = {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: formatDate(invoice.generatedDate),
      dueDate: formatDate(invoice.dueDate),
      status: invoice.status.toUpperCase(),
      studentId: String(student.id).padStart(6, '0'),
      student: {
        name: student.name,
        email: student.email || '',
      },
      parent: parent
        ? {
            name: parent.fullName || 'Parent',
            email: parent.email || '',
            address: parent.address || '',
            city: parent.city || '',
            country: parent.country || '',
          }
        : null,
      items: invoice.items || [],
      subtotal,
      tax,
      total,
      currency: invoice.currency || 'USD',
      companyName: settings.appName || businessInfo.companyLegalName || 'Education Management System',
      tagline: 'Comprehensive Learning Solutions',
      address: businessInfo.businessAddress || '123 Education Street, Learning City, LC 12345',
      phone: businessInfo.contactPhone || '+1 (555) 123-4567',
      email: businessInfo.contactEmail || 'info@educationportal.com',
      website: businessInfo.contactWebsite || '',
      taxNumber: businessInfo.taxRegistrationNumber || '',
      logo: settings.logoNavbar || '',
      bankDetails: bankDetails.bankName
        ? {
            name: bankDetails.bankName || '',
            accountNumber: bankDetails.bankAccountNumber || '',
            iban: bankDetails.bankIban || '',
            swiftCode: bankDetails.bankSwiftCode || '',
          }
        : null,
    };

    // Render HTML
    const html = template(templateData);

    // For server-side HTML to PDF, we need to use a library that works in Node.js
    // Since jsPDF html() requires browser APIs, we'll use a workaround
    // If you have a service/API for HTML to PDF conversion, use it here
    // Otherwise, we'll render the HTML template and you can configure a PDF service
    
    // For now, let's use jsPDF programmatically but with the new design structure
    // This ensures the PDF matches the updated design from the HTML template
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 0;

    // Header Accent Bar (Blue bar at top)
    doc.setFillColor(25, 118, 210); // #1976D2
    doc.rect(0, 0, pageWidth, 3, 'F');
    yPosition = 10;

    // Header Section - Two Column Layout
    // Left: Company Information
    const leftMargin = 15;
    const rightColumnStart = pageWidth - 100;

    // Company Logo and Name
    if (settings.logoNavbar && settings.logoNavbar.startsWith('data:image/')) {
      try {
        doc.addImage(settings.logoNavbar, 'PNG', leftMargin, yPosition, 20, 20);
      } catch (error) {
        console.warn('Failed to load company logo:', error);
      }
    }

    doc.setFontSize(16);
    doc.setTextColor(25, 118, 210); // #1976D2
    doc.setFont('helvetica', 'bold');
    doc.text(templateData.companyName, leftMargin + (settings.logoNavbar ? 25 : 0), yPosition + 8);
    
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141); // #7F8C8D
    doc.setFont('helvetica', 'italic');
    doc.text(templateData.tagline, leftMargin + (settings.logoNavbar ? 25 : 0), yPosition + 12);

    yPosition += 15;
    doc.setFontSize(8);
    doc.setTextColor(52, 73, 94); // #34495E
    doc.setFont('helvetica', 'normal');
    doc.text(templateData.address, leftMargin, yPosition);
    yPosition += 4;
    doc.text(`Phone: ${templateData.phone}`, leftMargin, yPosition);
    yPosition += 4;
    doc.text(`Email: ${templateData.email}`, leftMargin, yPosition);
    if (templateData.website) {
      yPosition += 4;
      doc.text(`Website: ${templateData.website}`, leftMargin, yPosition);
    }
    if (templateData.taxNumber) {
      yPosition += 4;
      doc.text(`Tax ID: ${templateData.taxNumber}`, leftMargin, yPosition);
    }

    // Right: Invoice Info Box
    const infoBoxY = 10;
    doc.setFillColor(248, 249, 250); // #F8F9FA
    doc.setDrawColor(25, 118, 210); // #1976D2
    doc.setLineWidth(0.5);
    doc.rect(rightColumnStart - 5, infoBoxY, 90, 50, 'FD');
    
    // Left border accent
    doc.setFillColor(25, 118, 210);
    doc.rect(rightColumnStart - 5, infoBoxY, 2, 50, 'F');

    let infoY = infoBoxY + 8;
    doc.setFontSize(22);
    doc.setTextColor(25, 118, 210);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', rightColumnStart, infoY);
    infoY += 10;

    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice #:', rightColumnStart, infoY);
    doc.setTextColor(44, 62, 80); // #2C3E50
    doc.text(templateData.invoiceNumber, rightColumnStart + 35, infoY);
    infoY += 6;

    doc.setTextColor(127, 140, 141);
    doc.text('Date:', rightColumnStart, infoY);
    doc.setTextColor(44, 62, 80);
    doc.text(templateData.issueDate, rightColumnStart + 35, infoY);
    infoY += 6;

    doc.setTextColor(127, 140, 141);
    doc.text('Due Date:', rightColumnStart, infoY);
    doc.setTextColor(44, 62, 80);
    doc.text(templateData.dueDate, rightColumnStart + 35, infoY);
    infoY += 8;

    // Status Badge
    doc.setFillColor(232, 245, 233); // #E8F5E9
    doc.rect(rightColumnStart, infoY, 30, 6, 'F');
    doc.setFontSize(8);
    doc.setTextColor(46, 125, 50); // #2E7D32
    doc.setFont('helvetica', 'bold');
    doc.text(templateData.status, rightColumnStart + 2, infoY + 4.5);

    yPosition = 70;

    // Student ID Section
    if (templateData.studentId) {
      doc.setFillColor(250, 250, 250); // #FAFAFA
      doc.setDrawColor(52, 73, 94); // #34495E
      doc.rect(leftMargin, yPosition, pageWidth - 30, 12, 'FD');
      doc.setFillColor(52, 73, 94);
      doc.rect(leftMargin, yPosition, 2, 12, 'F');
      
      doc.setFontSize(7);
      doc.setTextColor(127, 140, 141);
      doc.setFont('helvetica', 'bold');
      doc.text('STUDENT ID', leftMargin + 5, yPosition + 5);
      doc.setFontSize(11);
      doc.setTextColor(44, 62, 80);
      doc.text(`STU-${templateData.studentId}`, leftMargin + 5, yPosition + 9);
      yPosition += 20;
    }

    // Bill To Section - Two Cards
    const cardWidth = (pageWidth - 30 - 10) / 2;
    
    if (templateData.parent) {
      doc.setFillColor(250, 250, 250);
      doc.rect(leftMargin, yPosition, cardWidth, 35, 'F');
      doc.setFontSize(9);
      doc.setTextColor(52, 73, 94);
      doc.setFont('helvetica', 'bold');
      doc.text('BILL TO', leftMargin + 5, yPosition + 8);
      doc.setLineWidth(0.5);
      doc.setDrawColor(25, 118, 210);
      doc.line(leftMargin + 5, yPosition + 10, leftMargin + cardWidth - 5, yPosition + 10);
      
      let cardY = yPosition + 15;
      doc.setFontSize(10);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text(templateData.parent.name, leftMargin + 5, cardY);
      cardY += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(52, 73, 94);
      doc.text(templateData.parent.email, leftMargin + 5, cardY);
      if (templateData.parent.address) {
        cardY += 4;
        doc.text(templateData.parent.address, leftMargin + 5, cardY);
      }
    }

    if (templateData.student) {
      doc.setFillColor(250, 250, 250);
      doc.rect(leftMargin + cardWidth + 10, yPosition, cardWidth, 35, 'F');
      doc.setFontSize(9);
      doc.setTextColor(52, 73, 94);
      doc.setFont('helvetica', 'bold');
      doc.text('STUDENT', leftMargin + cardWidth + 15, yPosition + 8);
      doc.setLineWidth(0.5);
      doc.setDrawColor(25, 118, 210);
      doc.line(leftMargin + cardWidth + 15, yPosition + 10, leftMargin + cardWidth * 2 + 5, yPosition + 10);
      
      let cardY = yPosition + 15;
      doc.setFontSize(10);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text(templateData.student.name, leftMargin + cardWidth + 15, cardY);
      cardY += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(52, 73, 94);
      doc.text(templateData.student.email, leftMargin + cardWidth + 15, cardY);
    }

    yPosition += 45;

    // Invoice Items Table
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(25, 118, 210); // #1976D2
    doc.rect(leftMargin, yPosition, pageWidth - 30, 8, 'F');
    
    const colDesc = leftMargin + 2;
    const colQty = colDesc + (pageWidth - 30) * 0.5;
    const colUnit = colQty + (pageWidth - 30) * 0.15;
    const colTotal = colUnit + (pageWidth - 30) * 0.175;

    doc.text('Description', colDesc, yPosition + 5.5);
    doc.text('Qty', colQty, yPosition + 5.5);
    doc.text('Unit Price', colUnit, yPosition + 5.5);
    doc.text('Total', colTotal, yPosition + 5.5);

    yPosition += 10;

    // Table Rows
    if (templateData.items && templateData.items.length > 0) {
      templateData.items.forEach((item: any, index: number) => {
        if (index % 2 === 1) {
          doc.setFillColor(248, 249, 250);
          doc.rect(leftMargin, yPosition - 2, pageWidth - 30, 8, 'F');
        }
        
        doc.setFontSize(9);
        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(item.description, (pageWidth - 30) * 0.5 - 4);
        doc.text(descLines, colDesc, yPosition + 4);
        
        doc.text(String(item.quantity), colQty, yPosition + 4);
        doc.text(`${templateData.currency} ${Number(item.unitPrice).toFixed(2)}`, colUnit, yPosition + 4, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text(`${templateData.currency} ${Number(item.total).toFixed(2)}`, colTotal, yPosition + 4, { align: 'right' });
        
        yPosition += Math.max(8, descLines.length * 4);
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(44, 62, 80);
      doc.text('No items found', colDesc, yPosition + 4);
    }

    yPosition += 15;

    // Totals Section
    const totalsX = pageWidth - 100;
    doc.setFontSize(9);
    doc.setTextColor(52, 73, 94);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, yPosition);
    doc.setFont('helvetica', 'bold');
    doc.text(`${templateData.currency} ${templateData.subtotal.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 6;

    if (templateData.tax > 0) {
      doc.setFont('helvetica', 'normal');
      doc.text('Tax:', totalsX, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.text(`${templateData.currency} ${templateData.tax.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 6;
    }

    // Grand Total
    doc.setFillColor(25, 118, 210);
    doc.rect(totalsX - 5, yPosition - 3, pageWidth - totalsX + 5, 10, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL AMOUNT', totalsX, yPosition + 3);
    doc.setFontSize(13);
    doc.text(`${templateData.currency} ${templateData.total.toFixed(2)}`, pageWidth - 20, yPosition + 3, { align: 'right' });
    yPosition += 20;

    // Footer - Payment Information
    doc.setFillColor(248, 249, 250);
    doc.rect(leftMargin, yPosition, pageWidth - 30, 40, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(25, 118, 210);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT INFORMATION', leftMargin + 5, yPosition + 8);
    
    yPosition += 12;
    doc.setFontSize(8);
    doc.setTextColor(52, 73, 94);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment is due within 30 days from the invoice date.', leftMargin + 5, yPosition);

    if (templateData.bankDetails) {
      yPosition += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Bank Transfer Details:', leftMargin + 5, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      if (templateData.bankDetails.name) {
        doc.text(`Bank Name: ${templateData.bankDetails.name}`, leftMargin + 5, yPosition);
        yPosition += 4;
      }
      if (templateData.bankDetails.accountNumber) {
        doc.text(`Account: ${templateData.bankDetails.accountNumber}`, leftMargin + 5, yPosition);
        yPosition += 4;
      }
      if (templateData.bankDetails.iban) {
        doc.text(`IBAN: ${templateData.bankDetails.iban}`, leftMargin + 5, yPosition);
        yPosition += 4;
      }
      if (templateData.bankDetails.swiftCode) {
        doc.text(`SWIFT: ${templateData.bankDetails.swiftCode}`, leftMargin + 5, yPosition);
      }
    }

    yPosition += 15;
    doc.setFontSize(9);
    doc.setTextColor(127, 140, 141);
    doc.setFont('helvetica', 'italic');
    doc.text(`Thank you for choosing ${templateData.companyName} for your educational needs.`, pageWidth / 2, yPosition, { align: 'center' });

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
