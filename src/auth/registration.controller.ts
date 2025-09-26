import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { StudentsService } from '../students/students.service';
import { ParentsService } from '../parents/parents.service';
import { CreateStudentDto } from '../students/dto/create-student.dto';
import { CreateParentDto } from '../parents/dto/create-parent.dto';
import { Student } from '../students/domain/student';
import { Parent } from '../parents/domain/parent';
import { InvoicesService } from '../invoices/invoices.service';
import { ClassesService } from '../classes/classes.service';
import { PublicPurchaseDto } from './dto/public-purchase.dto';

@ApiTags('Registration')
@Controller({
  path: 'registration',
  version: '1',
})
export class RegistrationController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly parentsService: ParentsService,
    private readonly invoicesService: InvoicesService,
    private readonly classesService: ClassesService,
  ) {}

  @Post('student')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student registered successfully (public endpoint)',
    type: Object,
  })
  @HttpCode(HttpStatus.CREATED)
  async registerStudent(
    @Body() createStudentDto: CreateStudentDto,
  ): Promise<{ student: Student; user: any; tempPassword: string | null }> {
    return this.studentsService.create(createStudentDto);
  }

  @Post('parent')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Parent registered successfully (public endpoint)',
    type: Object,
  })
  @HttpCode(HttpStatus.CREATED)
  async registerParent(
    @Body() createParentDto: CreateParentDto,
  ): Promise<{ parent: Parent; user: any; tempPassword: string | null }> {
    return this.parentsService.create(createParentDto);
  }

  // Public combined purchase endpoint: create parent & student, enroll, generate invoice (unpaid)
  @Post('purchase')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Public purchase: account, enrollment, invoice created',
    type: Object,
  })
  @HttpCode(HttpStatus.CREATED)
  async purchaseCourse(
    @Body() body: PublicPurchaseDto,
  ): Promise<{ studentId: number; parentId?: number; invoiceIds: number[] }> {
    // Create parent
    const parentResult = await this.parentsService.create({
      fullName: body.parentName || body.studentName,
      email: body.email,
      phone: body.phone,
    } as any);

    // Create student linked to parent and enroll in class
    const studentResult = await this.studentsService.create({
      name: body.studentName,
      email: body.email,
      contact: body.phone,
      classes: [{ id: body.classId }],
      parents: parentResult?.parent?.id ? [{ id: parentResult.parent.id }] : [],
    } as any);

    // Enrollment inside create() generates invoice(s) via StudentsService.generateMonthlyInvoice
    // Find invoices for this student
    const invoices = await this.invoicesService.findByStudent(
      studentResult.student.id,
    );

    return {
      studentId: studentResult.student.id,
      parentId: parentResult?.parent?.id,
      invoiceIds: (invoices || []).map((i) => i.id),
    };
  }
}
