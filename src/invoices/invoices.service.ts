import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
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
    console.log('🔍 findByStudentUserId - Looking for student with user ID:', userId);
    
    // First find the student by user ID
    const student = await this.studentsService.findByUserId(userId);
    console.log('🔍 findByStudentUserId - Found student:', student);
    
    if (!student) {
      console.log('🔍 findByStudentUserId - No student found, returning empty array');
      return [];
    }
    
    // Then get invoices for that student
    console.log('🔍 findByStudentUserId - Getting invoices for student ID:', student.id);
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

    const doc = new jsPDF();

    // Set up the PDF content
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, yPosition);
    yPosition += 10;

    // Invoice number and date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, yPosition);
    yPosition += 5;
    doc.text(
      `Date: ${new Date(invoice.generatedDate).toLocaleDateString()}`,
      20,
      yPosition,
    );
    yPosition += 5;
    doc.text(
      `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
      20,
      yPosition,
    );
    yPosition += 20;

    // Bill to section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    if (parent) {
      doc.text(parent.fullName || 'Parent', 20, yPosition);
      yPosition += 5;
      if (parent.email) {
        doc.text(parent.email, 20, yPosition);
        yPosition += 5;
      }
    }
    doc.text(`Student: ${student.name}`, 20, yPosition);
    yPosition += 10;

    // Description
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Description:', 20, yPosition);
    yPosition += 5;
    doc.text(invoice.description, 20, yPosition);
    yPosition += 15;

    // Amount
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Amount: ${invoice.currency} ${invoice.amount.toFixed(2)}`,
      20,
      yPosition,
    );
    yPosition += 10;

    // Status
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, yPosition);

    // Notes
    if (invoice.notes) {
      yPosition += 15;
      doc.text('Notes:', 20, yPosition);
      yPosition += 5;
      doc.text(invoice.notes, 20, yPosition);
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
