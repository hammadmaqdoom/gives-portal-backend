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
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Students retrieved successfully',
    type: [StudentResponseDto],
  })
  findAll(
    @Query() filterStudentDto: FilterStudentDto,
    @Query() sortStudentDto: SortStudentDto,
    @Query() paginationOptionsDto: PaginationOptionsDto,
  ) {
    return this.studentsService.findManyWithPagination({
      filterOptions: filterStudentDto,
      sortOptions: sortStudentDto ? [sortStudentDto] : null,
      paginationOptions: {
        page: paginationOptionsDto.page,
        limit: paginationOptionsDto.limit,
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
  @ApiOperation({ summary: 'Automatically link all students to their user accounts by email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Students linked to users successfully',
  })
  async autoLinkStudents() {
    return this.studentsService.autoLinkStudentsToUsers();
  }
}
