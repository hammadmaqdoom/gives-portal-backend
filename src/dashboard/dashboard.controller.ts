import {
  Controller,
  Get,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { DashboardService } from './dashboard.service';
import { AdminStatsDto, AdminAnalyticsDto } from './dto/admin-dashboard.dto';
import {
  TeacherStatsDto,
  TeacherAnalyticsDto,
} from './dto/teacher-dashboard.dto';
import {
  StudentStatsDto,
  StudentAnalyticsDto,
} from './dto/student-dashboard.dto';
import { ParentStatsDto, ParentAnalyticsDto } from './dto/parent-dashboard.dto';

@ApiTags('Dashboard')
@Controller({
  path: 'dashboard',
  version: '1',
})
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin/stats')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin dashboard stats retrieved successfully',
    type: AdminStatsDto,
  })
  getAdminStats(): Promise<AdminStatsDto> {
    return this.dashboardService.getAdminStats();
  }

  @Get('admin/analytics')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin dashboard analytics retrieved successfully',
    type: AdminAnalyticsDto,
  })
  getAdminAnalytics(): Promise<AdminAnalyticsDto> {
    return this.dashboardService.getAdminAnalytics();
  }

  @Get('teacher/stats')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.teacher)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher dashboard stats retrieved successfully',
    type: TeacherStatsDto,
  })
  async getTeacherStats(@Request() req): Promise<TeacherStatsDto> {
    // Find teacher by user email
    const teacher = await this.dashboardService.findTeacherByUserEmail(
      req.user.email,
    );
    if (!teacher) {
      throw new Error('Teacher not found for this user');
    }
    return this.dashboardService.getTeacherStats(teacher.id);
  }

  @Get('teacher/analytics')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.teacher)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teacher dashboard analytics retrieved successfully',
    type: TeacherAnalyticsDto,
  })
  async getTeacherAnalytics(@Request() req): Promise<TeacherAnalyticsDto> {
    // Find teacher by user email
    const teacher = await this.dashboardService.findTeacherByUserEmail(
      req.user.email,
    );
    if (!teacher) {
      throw new Error('Teacher not found for this user');
    }
    return this.dashboardService.getTeacherAnalytics(teacher.id);
  }

  @Get('student/stats')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student dashboard stats retrieved successfully',
    type: StudentStatsDto,
  })
  async getStudentStats(@Request() req): Promise<StudentStatsDto> {
    // Find student by user ID
    const student = await this.dashboardService.findStudentByUserId(
      req.user.id,
    );
    if (!student) {
      // Return empty defaults instead of throwing to avoid 500s for users without linked student
      return {
        enrolledClasses: 0,
        attendanceRate: 0,
        averageGrade: 0,
        pendingAssignments: 0,
        completedAssignments: 0,
        feeStatus: 'paid',
      };
    }
    return this.dashboardService.getStudentStats(student.id);
  }

  @Get('student/analytics')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student dashboard analytics retrieved successfully',
    type: StudentAnalyticsDto,
  })
  async getStudentAnalytics(@Request() req): Promise<StudentAnalyticsDto> {
    // Find student by user ID
    const student = await this.dashboardService.findStudentByUserId(
      req.user.id,
    );
    if (!student) {
      // Return empty analytics to avoid breaking student UI
      return {
        gradeProgress: [],
        attendanceCalendar: [],
        assignmentStatus: [],
      };
    }
    return this.dashboardService.getStudentAnalytics(student.id);
  }

  @Get('parent/stats')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parent dashboard stats retrieved successfully',
    type: ParentStatsDto,
  })
  async getParentStats(@Request() req): Promise<ParentStatsDto> {
    // Find parent by user ID
    const parent = await this.dashboardService.findParentByUserId(req.user.id);
    if (!parent) {
      throw new Error('Parent not found for this user');
    }
    return this.dashboardService.getParentStats(parent.id);
  }

  @Get('parent/analytics')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Parent dashboard analytics retrieved successfully',
    type: ParentAnalyticsDto,
  })
  async getParentAnalytics(@Request() req): Promise<ParentAnalyticsDto> {
    // Find parent by user ID
    const parent = await this.dashboardService.findParentByUserId(req.user.id);
    if (!parent) {
      throw new Error('Parent not found for this user');
    }
    return this.dashboardService.getParentAnalytics(parent.id);
  }
}
