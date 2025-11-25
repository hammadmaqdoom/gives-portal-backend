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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { TeacherCommissionService } from './teacher-commission.service';
import { CreateTeacherCommissionDto } from './dto/create-teacher-commission.dto';
import { UpdateTeacherCommissionDto } from './dto/update-teacher-commission.dto';
import {
  FilterTeacherCommissionDto,
  SortTeacherCommissionDto,
} from './dto/query-teacher-commission.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { TeacherCommission } from './domain/teacher-commission';

@ApiTags('Teacher Commissions')
@Controller({
  path: 'teacher-commissions',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TeacherCommissionController {
  constructor(
    private readonly teacherCommissionService: TeacherCommissionService,
  ) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Create a new teacher commission' })
  @ApiResponse({ status: 201, description: 'Commission created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body() createCommissionDto: CreateTeacherCommissionDto,
  ): Promise<TeacherCommission> {
    return this.teacherCommissionService.create(createCommissionDto);
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({
    summary: 'Get all teacher commissions with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Commissions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findMany(
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Query('filters') filters?: string,
    @Query('sort') sort?: string,
  ): Promise<TeacherCommission[]> {
    const paginationOptions: IPaginationOptions = { page, limit };

    let filterOptions: FilterTeacherCommissionDto | null = null;
    if (filters) {
      try {
        filterOptions = JSON.parse(filters);
      } catch (error) {
        // Handle invalid JSON
      }
    }

    let sortOptions: SortTeacherCommissionDto[] | null = null;
    if (sort) {
      try {
        sortOptions = JSON.parse(sort);
      } catch (error) {
        // Handle invalid JSON
      }
    }

    return this.teacherCommissionService.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  @Get('pending')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Get all pending teacher commissions' })
  @ApiResponse({
    status: 200,
    description: 'Pending commissions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findPending(): Promise<TeacherCommission[]> {
    return this.teacherCommissionService.findPendingCommissions();
  }

  @Get('overdue')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Get all overdue teacher commissions' })
  @ApiResponse({
    status: 200,
    description: 'Overdue commissions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findOverdue(): Promise<TeacherCommission[]> {
    return this.teacherCommissionService.findOverdueCommissions();
  }

  @Get('teacher/:teacherId')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Get all commissions for a specific teacher' })
  @ApiResponse({
    status: 200,
    description: 'Teacher commissions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByTeacher(
    @Param('teacherId') teacherId: string,
  ): Promise<TeacherCommission[]> {
    return this.teacherCommissionService.findByTeacher(+teacherId);
  }

  @Get('class/:classId')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Get all commissions for a specific class' })
  @ApiResponse({
    status: 200,
    description: 'Class commissions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByClass(@Param('classId') classId: string): Promise<TeacherCommission[]> {
    return this.teacherCommissionService.findByClass(+classId);
  }

  @Get('student/:studentId')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Get all commissions for a specific student' })
  @ApiResponse({
    status: 200,
    description: 'Student commissions retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByStudent(
    @Param('studentId') studentId: string,
  ): Promise<TeacherCommission[]> {
    return this.teacherCommissionService.findByStudent(+studentId);
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Get a specific teacher commission by ID' })
  @ApiResponse({
    status: 200,
    description: 'Commission retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Commission not found' })
  findOne(@Param('id') id: string): Promise<TeacherCommission | null> {
    return this.teacherCommissionService.findById(+id);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Update a teacher commission' })
  @ApiResponse({ status: 200, description: 'Commission updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Commission not found' })
  update(
    @Param('id') id: string,
    @Body() updateCommissionDto: UpdateTeacherCommissionDto,
  ): Promise<TeacherCommission | null> {
    return this.teacherCommissionService.update(+id, updateCommissionDto);
  }

  @Patch(':id/mark-paid')
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a teacher commission as paid' })
  @ApiResponse({
    status: 200,
    description: 'Commission marked as paid successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Commission not found' })
  markAsPaid(
    @Param('id') id: string,
    @Body('transactionId') transactionId?: string,
  ): Promise<TeacherCommission | null> {
    return this.teacherCommissionService.markAsPaid(+id, transactionId);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a teacher commission' })
  @ApiResponse({ status: 204, description: 'Commission deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Commission not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.teacherCommissionService.remove(+id);
  }
}
