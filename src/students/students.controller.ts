import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { FilterStudentDto, SortStudentDto } from './dto/query-student.dto';
import { PaginationOptionsDto } from '../utils/dto/pagination-options.dto';
import { RolesGuard } from '../roles/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import {
  CreateEnrollmentDto,
  UpdateEnrollmentDto,
  EnrollmentResponseDto,
} from './dto/enrollment.dto';
import {
  StudentResponseDto,
  StudentWithDetailsResponseDto,
} from './dto/student-response.dto';
import { BulkEnrollmentResultDto } from './dto/bulk-enrollment-response.dto';

@ApiTags('Students')
@Controller({
  path: 'students',
  version: '1',
})
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('test')
  test() {
    return { message: 'Students controller is working!' };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user student profile retrieved successfully',
    type: StudentResponseDto,
  })
  async getCurrentUserStudent(@Request() req) {
    console.log(
      `getCurrentUserStudent called with user ID: ${req.user.id}, email: ${req.user.email}`,
    );

    // Try to find student by user ID first
    let student = await this.studentsService.findByUserId(req.user.id);
    console.log(`findByUserId result:`, student);

    // If not found by user ID, try by email
    if (!student && req.user.email) {
      console.log(`Trying to find student by email: ${req.user.email}`);
      student = await this.studentsService.findByEmail(req.user.email);
      console.log(`findByEmail result:`, student);
    }

    if (!student) {
      throw new NotFoundException('Student profile not found for current user');
    }
    return student;
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student created successfully',
    type: Object,
  })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Post('register')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student registered successfully (public endpoint)',
    type: Object,
  })
  register(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user, RoleEnum.teacher)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Students retrieved successfully',
    type: [StudentResponseDto],
  })
  findAll(
    @Query('search') search?: string,
    @Query() filterStudentDto?: FilterStudentDto,
    @Query() sortStudentDto?: SortStudentDto,
    @Query() paginationOptionsDto?: PaginationOptionsDto,
  ) {
    // Merge top-level search parameter with filter DTO (prioritize top-level)
    const filterOptions = {
      ...filterStudentDto,
      search: search || filterStudentDto?.search,
    };

    return this.studentsService.findManyWithPagination({
      filterOptions,
      sortOptions: sortStudentDto ? [sortStudentDto] : null,
      paginationOptions: {
        page: paginationOptionsDto?.page || 1,
        limit: paginationOptionsDto?.limit || 10,
      },
      includeRelations: true,
    });
  }

  @Get('debug/all')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Debug: List all students',
  })
  async getAllStudentsDebug() {
    const students = await this.studentsService.findManyWithPagination({
      filterOptions: null,
      sortOptions: null,
      paginationOptions: { page: 1, limit: 50 },
      includeRelations: true,
    });

    return {
      count: students.length,
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        userId: s.user?.id,
        userEmail: s.user?.email,
      })),
    };
  }

  @Get('debug/current-user')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Debug: Current user info',
  })
  async getCurrentUserDebug(@Request() req) {
    return {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
      },
      message: 'This is the current user info from JWT token',
    };
  }

  // Enrollment Management Endpoints - Must be before :id routes
  @Get('enrollments/all')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All enrollments retrieved successfully',
  })
  getAllEnrollments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.studentsService.getAllEnrollments({
      page: page ? +page : 1,
      limit: limit ? +limit : 10,
    });
  }

  @Get('enrollments/stats')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Enrollment statistics retrieved successfully',
  })
  getEnrollmentStats() {
    return this.studentsService.getEnrollmentStats();
  }

  @Get('classes/:classId/enrollment-history')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Class enrollment history retrieved successfully',
  })
  getClassEnrollmentHistory(@Param('classId') classId: string) {
    return this.studentsService.getClassEnrollmentHistory(+classId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student retrieved successfully',
    type: StudentResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.studentsService.findById(+id);
  }

  @Get(':id/details')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student with details retrieved successfully',
    type: StudentWithDetailsResponseDto,
  })
  findOneWithDetails(@Param('id') id: string) {
    return this.studentsService.getStudentWithDetails(+id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student updated successfully',
    type: StudentResponseDto,
  })
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(+id, updateStudentDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Student deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(+id);
  }

  // Enrollment Management Endpoints
  @Post(':id/enrollments')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student enrolled in class successfully',
    type: EnrollmentResponseDto,
  })
  enrollInClass(
    @Param('id') id: string,
    @Body() createEnrollmentDto: CreateEnrollmentDto,
  ) {
    return this.studentsService.enrollInClass(+id, createEnrollmentDto);
  }

  @Patch(':id/enrollments/:classId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Enrollment updated successfully',
    type: EnrollmentResponseDto,
  })
  updateEnrollment(
    @Param('id') id: string,
    @Param('classId') classId: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.studentsService.updateEnrollment(
      +id,
      +classId,
      updateEnrollmentDto,
    );
  }

  @Delete(':id/enrollments/:classId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Enrollment removed successfully',
  })
  removeEnrollment(@Param('id') id: string, @Param('classId') classId: string) {
    return this.studentsService.removeEnrollment(+id, +classId);
  }

  @Get(':id/enrollments')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student enrollments retrieved successfully',
    type: [EnrollmentResponseDto],
  })
  getEnrollments(@Param('id') id: string) {
    return this.studentsService.getEnrollments(+id);
  }

  @Get(':id/enrollment-history')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student enrollment history retrieved successfully',
  })
  getEnrollmentHistory(@Param('id') id: string) {
    return this.studentsService.getEnrollmentHistory(+id);
  }

  @Post(':id/enrollments/bulk')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student enrolled in multiple classes successfully',
  })
  bulkEnrollStudentInClasses(
    @Param('id') id: string,
    @Body()
    body: { 
      classIds: number[]; 
      status?: string; 
      enrollmentDate?: string;
      customFees?: Array<{ classId: number; customFeePKR?: number | null; customFeeUSD?: number | null }>;
    },
  ) {
    return this.studentsService.bulkEnrollStudentInClasses(+id, body);
  }

  // Student-User Linking Endpoints
  @Post('link-to-user/:studentId/:userId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Link a student to a user account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student linked to user successfully',
  })
  async linkStudentToUser(
    @Param('studentId') studentId: string,
    @Param('userId') userId: string,
  ) {
    return this.studentsService.linkStudentToUser(+studentId, +userId);
  }

  @Post('auto-link-students')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiOperation({
    summary: 'Automatically link all students to their user accounts by email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Students linked to users successfully',
  })
  async autoLinkStudents() {
    return this.studentsService.autoLinkStudentsToUsers();
  }

  @Post('bulk-enroll')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiOperation({
    summary: 'Bulk enroll students from Excel/CSV file',
    description:
      'Upload an Excel or CSV file with student and parent details to bulk enroll students in classes',
  })
  @ApiQuery({
    name: 'duplicateHandling',
    required: false,
    enum: ['skip', 'update'],
    description: 'How to handle duplicates: skip or update (default: skip)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Excel (.xlsx, .xls) or CSV file with student and parent data',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk enrollment processed successfully',
    type: BulkEnrollmentResultDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async bulkEnroll(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            // Accept CSV, XLS, and XLSX MIME types (with optional parameters like charset)
            fileType:
              /^(text\/csv|application\/csv|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)(;|$)/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('duplicateHandling') duplicateHandling?: 'skip' | 'update',
  ): Promise<BulkEnrollmentResultDto> {
    return this.studentsService.bulkEnrollFromFile(file, duplicateHandling || 'skip');
  }
}
