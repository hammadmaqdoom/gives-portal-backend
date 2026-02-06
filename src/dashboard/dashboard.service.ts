import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { StudentEntity } from '../students/infrastructure/persistence/relational/entities/student.entity';
import { TeacherEntity } from '../teachers/infrastructure/persistence/relational/entities/teacher.entity';
import { ClassEntity } from '../classes/infrastructure/persistence/relational/entities/class.entity';
import { AttendanceEntity } from '../attendance/infrastructure/persistence/relational/entities/attendance.entity';
import { FeeEntity } from '../fees/infrastructure/persistence/relational/entities/fee.entity';
import { PerformanceEntity } from '../performance/infrastructure/persistence/relational/entities/performance.entity';
import { AssignmentEntity } from '../assignments/infrastructure/persistence/relational/entities/assignment.entity';
import { SubmissionEntity } from '../assignments/infrastructure/persistence/relational/entities/submission.entity';
import { ParentEntity } from '../parents/infrastructure/persistence/relational/entities/parent.entity';
import { StudentClassEnrollmentEntity } from '../students/infrastructure/persistence/relational/entities/student-class-enrollment.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { FileEntity } from '../files/infrastructure/persistence/relational/entities/file.entity';
import { AttendanceStatus } from '../attendance/domain/attendance';
import { PaymentStatus } from '../fees/domain/fee';
import { AssignmentStatus } from '../assignments/domain/assignment';
import { SubmissionStatus } from '../assignments/infrastructure/persistence/relational/entities/submission.entity';
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
import { SuperAdminStatsDto } from './dto/super-admin-dashboard.dto';
import { CurrencyService } from '../currency/currency.service';
import { SettingsService } from '../settings/settings.service';
import { ConfigService } from '@nestjs/config';
import { RoleEnum } from '../roles/roles.enum';
import { FileDriver } from '../files/config/file-config.type';
import { RedisService } from '../cache/redis.service';
import { TeachersService } from '../teachers/teachers.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(StudentEntity)
    private studentRepository: Repository<StudentEntity>,
    @InjectRepository(TeacherEntity)
    private teacherRepository: Repository<TeacherEntity>,
    @InjectRepository(ClassEntity)
    private classRepository: Repository<ClassEntity>,
    @InjectRepository(AttendanceEntity)
    private attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(FeeEntity)
    private feeRepository: Repository<FeeEntity>,
    @InjectRepository(PerformanceEntity)
    private performanceRepository: Repository<PerformanceEntity>,
    @InjectRepository(AssignmentEntity)
    private assignmentRepository: Repository<AssignmentEntity>,
    @InjectRepository(SubmissionEntity)
    private submissionRepository: Repository<SubmissionEntity>,
    @InjectRepository(ParentEntity)
    private parentRepository: Repository<ParentEntity>,
    @InjectRepository(StudentClassEnrollmentEntity)
    private enrollmentRepository: Repository<StudentClassEnrollmentEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
    private readonly currencyService: CurrencyService,
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly teachersService: TeachersService,
  ) {}

  async getAdminStats(): Promise<AdminStatsDto> {
    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      totalClasses,
      totalParents,
      totalRevenue,
      pendingFees,
      recentEnrollments,
      recentPayments,
    ] = await Promise.all([
      this.studentRepository.count(),
      this.studentRepository.count({
        where: { deletedAt: null as any },
      }),
      this.teacherRepository.count(),
      this.classRepository.count(),
      this.parentRepository.count(),
      this.getTotalRevenue(),
      this.getPendingFees(),
      this.getRecentEnrollments(),
      this.getRecentPayments(),
    ]);

    const averageAttendance = await this.getAverageAttendance();

    return {
      totalStudents,
      activeStudents,
      totalTeachers,
      totalClasses,
      totalParents,
      totalRevenue,
      pendingFees,
      averageAttendance,
      recentEnrollments,
      recentPayments,
    };
  }

  async getAdminAnalytics(): Promise<AdminAnalyticsDto> {
    const [
      enrollmentTrends,
      revenueAnalytics,
      attendanceByClass,
      teacherPerformance,
    ] = await Promise.all([
      this.getEnrollmentTrends(),
      this.getRevenueAnalytics(),
      this.getAttendanceByClass(),
      this.getTeacherPerformance(),
    ]);

    return {
      enrollmentTrends,
      revenueAnalytics,
      attendanceByClass,
      teacherPerformance,
    };
  }

  async getTeacherStats(teacherId: number): Promise<TeacherStatsDto> {
    const [
      myClasses,
      totalStudents,
      averageAttendance,
      pendingAssignments,
      completedAssignments,
      averageGrade,
    ] = await Promise.all([
      this.getClassCountForTeacher(teacherId),
      this.getStudentCountForTeacher(teacherId),
      this.getAverageAttendanceForTeacher(teacherId),
      this.getPendingAssignmentsForTeacher(teacherId),
      this.getCompletedAssignmentsForTeacher(teacherId),
      this.getAverageGradeForTeacher(teacherId),
    ]);

    return {
      myClasses,
      totalStudents,
      averageAttendance,
      pendingAssignments,
      completedAssignments,
      averageGrade,
    };
  }

  async getTeacherAnalytics(teacherId: number): Promise<TeacherAnalyticsDto> {
    const [classAttendance, studentPerformance, assignmentStatus] =
      await Promise.all([
        this.getClassAttendanceForTeacher(teacherId),
        this.getStudentPerformanceForTeacher(teacherId),
        this.getAssignmentStatusForTeacher(teacherId),
      ]);

    return {
      classAttendance,
      studentPerformance,
      assignmentStatus,
    };
  }

  async getStudentStats(studentId: number): Promise<StudentStatsDto> {
    const [
      enrolledClasses,
      attendanceRate,
      averageGrade,
      pendingAssignments,
      completedAssignments,
      feeStatus,
    ] = await Promise.all([
      this.getEnrolledClassCount(studentId),
      this.getAttendanceRateForStudent(studentId),
      this.getAverageGradeForStudent(studentId),
      this.getPendingAssignmentsForStudent(studentId),
      this.getCompletedAssignmentsForStudent(studentId),
      this.getFeeStatusForStudent(studentId),
    ]);

    return {
      enrolledClasses,
      attendanceRate,
      averageGrade,
      pendingAssignments,
      completedAssignments,
      feeStatus,
    };
  }

  async getStudentAnalytics(studentId: number): Promise<StudentAnalyticsDto> {
    const [gradeProgress, attendanceCalendar, assignmentStatus] =
      await Promise.all([
        this.getGradeProgressForStudent(studentId),
        this.getAttendanceCalendarForStudent(studentId),
        this.getAssignmentStatusForStudent(studentId),
      ]);

    return {
      gradeProgress,
      attendanceCalendar,
      assignmentStatus,
    };
  }

  async getParentStats(parentId: number): Promise<ParentStatsDto> {
    const [
      childrenCount,
      averageAttendance,
      outstandingFees,
      unreadMessages,
      upcomingEvents,
      recentPayments,
    ] = await Promise.all([
      this.getChildrenCountForParent(parentId),
      this.getAverageAttendanceForParent(parentId),
      this.getOutstandingFeesForParent(parentId),
      this.getUnreadMessagesForParent(parentId),
      this.getUpcomingEventsForParent(parentId),
      this.getRecentPaymentsForParent(parentId),
    ]);

    return {
      childrenCount,
      averageAttendance,
      outstandingFees,
      unreadMessages,
      upcomingEvents,
      recentPayments,
    };
  }

  async getParentAnalytics(parentId: number): Promise<ParentAnalyticsDto> {
    const [childrenPerformance, feeHistory] = await Promise.all([
      this.getChildrenPerformanceForParent(parentId),
      this.getFeeHistoryForParent(parentId),
    ]);

    return {
      childrenPerformance,
      feeHistory,
    };
  }

  // Helper methods for admin analytics
  private async getTotalRevenue(): Promise<number> {
    const result = await this.feeRepository
      .createQueryBuilder('fee')
      .select('SUM(fee.amount)', 'total')
      .where('fee.status = :status', { status: PaymentStatus.PAID })
      .getRawOne();
    const total = parseFloat(result?.total || '0');
    const defaultCurrency =
      ((await this.settingsService.getSettingsOrCreate()) as any)
        .defaultCurrency || 'PKR';
    // Convert aggregated total to PKR
    return await this.currencyService.convert(total, defaultCurrency, 'PKR');
  }

  private async getPendingFees(): Promise<number> {
    const result = await this.feeRepository
      .createQueryBuilder('fee')
      .select('SUM(fee.amount)', 'total')
      .where('fee.status = :status', { status: PaymentStatus.UNPAID })
      .getRawOne();
    const total = parseFloat(result?.total || '0');
    const defaultCurrency =
      ((await this.settingsService.getSettingsOrCreate()) as any)
        .defaultCurrency || 'PKR';
    return await this.currencyService.convert(total, defaultCurrency, 'PKR');
  }

  private async getRecentEnrollments(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await this.enrollmentRepository.count({
      where: {
        createdAt: MoreThanOrEqual(thirtyDaysAgo),
      },
    });
  }

  private async getRecentPayments(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await this.feeRepository.count({
      where: {
        status: PaymentStatus.PAID,
        paidAt: MoreThanOrEqual(thirtyDaysAgo),
      },
    });
  }

  private async getAverageAttendance(): Promise<number> {
    const result = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select(
        'AVG(CASE WHEN attendance.status = :present THEN 100 ELSE 0 END)',
        'average',
      )
      .setParameter('present', AttendanceStatus.PRESENT)
      .getRawOne();
    return parseFloat(result?.average || '0');
  }

  private async getEnrollmentTrends() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select("DATE_TRUNC('month', enrollment.createdAt)", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('enrollment.createdAt >= :startDate', { startDate: sixMonthsAgo })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return result.map((item) => ({
      month: new Date(item.month).toLocaleDateString('en-US', {
        month: 'short',
      }),
      enrollments: parseInt(item.count),
    }));
  }

  private async getRevenueAnalytics() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await this.feeRepository
      .createQueryBuilder('fee')
      .select("DATE_TRUNC('month', fee.paidAt)", 'month')
      .addSelect('SUM(fee.amount)', 'total')
      .where('fee.status = :status', { status: PaymentStatus.PAID })
      .andWhere('fee.paidAt >= :startDate', { startDate: sixMonthsAgo })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    const defaultCurrency =
      ((await this.settingsService.getSettingsOrCreate()) as any)
        .defaultCurrency || 'PKR';
    const mapped = await Promise.all(
      result.map(async (item) => {
        const date = new Date(item.month);
        const amount = parseFloat(item.total);
        const revenuePKR = await this.currencyService.convert(
          amount,
          defaultCurrency,
          'PKR',
          date,
        );
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: revenuePKR,
        };
      }),
    );
    return mapped;
  }

  private async getAttendanceByClass() {
    const result = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoin('attendance.class', 'class')
      .select('class.name', 'className')
      .addSelect(
        'AVG(CASE WHEN attendance.status = :present THEN 100 ELSE 0 END)',
        'attendance',
      )
      .setParameter('present', AttendanceStatus.PRESENT)
      .groupBy('class.name')
      .getRawMany();

    return result.map((item) => ({
      class: item.className,
      attendance: parseFloat(item.attendance),
    }));
  }

  private async getTeacherPerformance() {
    try {
      const result = await this.performanceRepository
        .createQueryBuilder('performance')
        .leftJoin('performance.assignment', 'assignment')
        .leftJoin('assignment.teacher', 'teacher')
        .select('teacher.name', 'teacherName')
        .addSelect('AVG(performance.score)', 'rating')
        .groupBy('teacher.name')
        .getRawMany();

      return result.map((item) => ({
        teacher: item.teacherName,
        rating: parseFloat(item.rating),
      }));
    } catch (error) {
      return [];
    }
  }

  // Helper methods for teacher analytics
  private async getClassCountForTeacher(teacherId: number): Promise<number> {
    return await this.classRepository.count({
      where: { teacher: { id: teacherId } },
    });
  }

  private async getStudentCountForTeacher(teacherId: number): Promise<number> {
    const result = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoin('enrollment.class', 'class')
      .where('class.teacher.id = :teacherId', { teacherId })
      .getCount();
    return result;
  }

  private async getAverageAttendanceForTeacher(
    teacherId: number,
  ): Promise<number> {
    const result = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoin('attendance.class', 'class')
      .select(
        'AVG(CASE WHEN attendance.status = :present THEN 100 ELSE 0 END)',
        'average',
      )
      .setParameter('present', AttendanceStatus.PRESENT)
      .where('class.teacherId = :teacherId', { teacherId })
      .andWhere('attendance.deletedAt IS NULL')
      .andWhere('class.deletedAt IS NULL')
      .getRawOne();
    return parseFloat(result?.average || '0');
  }

  private async getPendingAssignmentsForTeacher(
    teacherId: number,
  ): Promise<number> {
    try {
      // Check both direct teacher assignment and assignments via class
      const result = await this.assignmentRepository
        .createQueryBuilder('assignment')
        .leftJoin('assignment.class', 'class')
        .where('assignment.status = :status', { status: AssignmentStatus.PUBLISHED })
        .andWhere('assignment.deletedAt IS NULL')
        .andWhere(
          '(assignment.teacherId = :teacherId OR class.teacherId = :teacherId)',
          { teacherId },
        )
        .getCount();
      return result;
    } catch (error) {
      // Fallback when assignment table/columns are missing
      return 0;
    }
  }

  private async getCompletedAssignmentsForTeacher(
    teacherId: number,
  ): Promise<number> {
    try {
      // Check both direct teacher assignment and assignments via class
      const result = await this.assignmentRepository
        .createQueryBuilder('assignment')
        .leftJoin('assignment.class', 'class')
        .where('assignment.status = :status', { status: AssignmentStatus.CLOSED })
        .andWhere('assignment.deletedAt IS NULL')
        .andWhere(
          '(assignment.teacherId = :teacherId OR class.teacherId = :teacherId)',
          { teacherId },
        )
        .getCount();
      return result;
    } catch (error) {
      // Fallback when assignment table/columns are missing
      return 0;
    }
  }

  private async getAverageGradeForTeacher(teacherId: number): Promise<number> {
    const result = await this.performanceRepository
      .createQueryBuilder('performance')
      .leftJoin('performance.assignment', 'assignment')
      .leftJoin('assignment.class', 'class')
      .select('AVG(performance.score)', 'average')
      .where(
        '(assignment.teacherId = :teacherId OR class.teacherId = :teacherId)',
        { teacherId },
      )
      .andWhere('performance.deletedAt IS NULL')
      .andWhere('assignment.deletedAt IS NULL')
      .getRawOne();
    return parseFloat(result?.average || '0');
  }

  private async getClassAttendanceForTeacher(teacherId: number) {
    try {
      const result = await this.attendanceRepository
        .createQueryBuilder('attendance')
        .leftJoin('attendance.class', 'class')
        .leftJoin('class.teacher', 'teacher')
        .select('class.name', 'className')
        .addSelect(
          'AVG(CASE WHEN attendance.status = :present THEN 100 ELSE 0 END)',
          'attendance',
        )
        .setParameter('present', AttendanceStatus.PRESENT)
        .where('(class.teacherId = :teacherId OR teacher.id = :teacherId)', { teacherId })
        .andWhere('attendance.deletedAt IS NULL')
        .andWhere('class.deletedAt IS NULL')
        .andWhere('(teacher.deletedAt IS NULL OR teacher.deletedAt IS NULL)')
        .groupBy('class.name')
        .getRawMany();

      const mapped = result
        .filter((item) => item.className != null)
        .map((item) => ({
          class: item.className,
          attendance: parseFloat(item.attendance || '0'),
        }));

      this.logger.debug(`getClassAttendanceForTeacher(${teacherId}): Found ${mapped.length} classes with attendance data`);
      return mapped;
    } catch (error) {
      this.logger.error(`Error getting class attendance for teacher ${teacherId}:`, error);
      return [];
    }
  }

  private async getStudentPerformanceForTeacher(teacherId: number) {
    try {
      // Try using Performance entity first
      const result = await this.performanceRepository
        .createQueryBuilder('performance')
        .leftJoin('performance.student', 'student')
        .leftJoin('performance.assignment', 'assignment')
        .leftJoin('assignment.class', 'class')
        .leftJoin('assignment.teacher', 'assignmentTeacher')
        .leftJoin('class.teacher', 'classTeacher')
        .select('student.name', 'studentName')
        .addSelect('AVG(performance.score)', 'grade')
        .where(
          '(assignment.teacherId = :teacherId OR class.teacherId = :teacherId OR assignmentTeacher.id = :teacherId OR classTeacher.id = :teacherId)',
          { teacherId },
        )
        .andWhere('performance.deletedAt IS NULL')
        .andWhere('assignment.deletedAt IS NULL')
        .andWhere('performance.score IS NOT NULL')
        .groupBy('student.name')
        .getRawMany();

      // If no results from Performance entity, try using Submission entity (where teachers actually grade)
      if (result.length === 0) {
        const submissionResult = await this.submissionRepository
          .createQueryBuilder('submission')
          .leftJoin('submission.student', 'student')
          .leftJoin('submission.assignment', 'assignment')
          .leftJoin('assignment.class', 'class')
          .leftJoin('assignment.teacher', 'assignmentTeacher')
          .leftJoin('class.teacher', 'classTeacher')
          .select('student.name', 'studentName')
          .addSelect('AVG(submission.score)', 'grade')
          .where(
            '(assignment.teacherId = :teacherId OR class.teacherId = :teacherId OR assignmentTeacher.id = :teacherId OR classTeacher.id = :teacherId)',
            { teacherId },
          )
          .andWhere('submission.deletedAt IS NULL')
          .andWhere('assignment.deletedAt IS NULL')
          .andWhere('submission.score IS NOT NULL')
          .groupBy('student.name')
          .getRawMany();

        const mapped = submissionResult
          .filter((item) => item.studentName != null)
          .map((item) => ({
            student: item.studentName,
            grade: parseFloat(item.grade || '0'),
          }));

        this.logger.debug(`getStudentPerformanceForTeacher(${teacherId}): Found ${mapped.length} students via submissions`);
        return mapped;
      }

      const mapped = result
        .filter((item) => item.studentName != null)
        .map((item) => ({
          student: item.studentName,
          grade: parseFloat(item.grade || '0'),
        }));

      this.logger.debug(`getStudentPerformanceForTeacher(${teacherId}): Found ${mapped.length} students via performance`);
      return mapped;
    } catch (error) {
      this.logger.error(`Error getting student performance for teacher ${teacherId}:`, error);
      return [];
    }
  }

  private async getAssignmentStatusForTeacher(teacherId: number) {
    try {
      // Assignment entity has no totalStudents; total = enrolled students in assignment's class
      const assignmentsWithSubmissions = await this.assignmentRepository
        .createQueryBuilder('assignment')
        .leftJoin('assignment.submissions', 'submission', 'submission.deletedAt IS NULL')
        .leftJoin('assignment.class', 'class')
        .leftJoin('assignment.teacher', 'assignmentTeacher')
        .leftJoin('class.teacher', 'classTeacher')
        .select('assignment.id', 'id')
        .addSelect('assignment.title', 'assignmentTitle')
        .addSelect('assignment.classId', 'classId')
        .addSelect('COUNT(DISTINCT submission.id)', 'submitted')
        .where(
          '(assignment.teacherId = :teacherId OR class.teacherId = :teacherId OR assignmentTeacher.id = :teacherId OR classTeacher.id = :teacherId)',
          { teacherId },
        )
        .andWhere('assignment.deletedAt IS NULL')
        .andWhere('(class.deletedAt IS NULL OR class.deletedAt IS NULL)')
        .groupBy('assignment.id')
        .addGroupBy('assignment.title')
        .addGroupBy('assignment.classId')
        .getRawMany();

      const classIds = [
        ...new Set(
          (assignmentsWithSubmissions as { classId: number }[])
            .map((a) => a.classId)
            .filter((id) => id != null),
        ),
      ];

      if (classIds.length === 0) {
        const result = assignmentsWithSubmissions.map((item: any) => ({
          assignment: item.assignmentTitle || 'Untitled Assignment',
          submitted: parseInt(item.submitted, 10) || 0,
          total: 0,
        }));
        this.logger.debug(`getAssignmentStatusForTeacher(${teacherId}): Found ${result.length} assignments but no class enrollments`);
        return result;
      }

      const enrollmentCounts = await this.enrollmentRepository
        .createQueryBuilder('enrollment')
        .select('enrollment.classId', 'classId')
        .addSelect('COUNT(DISTINCT enrollment.id)', 'total')
        .where('enrollment.classId IN (:...classIds)', { classIds })
        .andWhere('(enrollment.status = :status OR enrollment.status IS NULL)', { status: 'active' })
        .andWhere('enrollment.deletedAt IS NULL')
        .groupBy('enrollment.classId')
        .getRawMany();

      const totalByClassId = new Map<number, number>();
      for (const row of enrollmentCounts as { classId: number; total: string }[]) {
        totalByClassId.set(row.classId, parseInt(row.total, 10) || 0);
      }

      const result = assignmentsWithSubmissions.map((item: any) => ({
        assignment: item.assignmentTitle || 'Untitled Assignment',
        submitted: parseInt(item.submitted, 10) || 0,
        total: totalByClassId.get(item.classId) ?? 0,
      }));

      this.logger.debug(`getAssignmentStatusForTeacher(${teacherId}): Found ${result.length} assignments with status data`);
      return result;
    } catch (error) {
      this.logger.error(`Error getting assignment status for teacher ${teacherId}:`, error);
      // Fallback when submissions table or relations are missing
      return [];
    }
  }

  // Helper methods for student analytics
  async findStudentByUserId(userId: number): Promise<StudentEntity | null> {
    return await this.studentRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async findParentByUserId(userId: number): Promise<ParentEntity | null> {
    return await this.parentRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async findTeacherByUserEmail(
    userEmail: string,
  ): Promise<TeacherEntity | null> {
    // Use case-insensitive email lookup
    return await this.teacherRepository
      .createQueryBuilder('teacher')
      .where('LOWER(teacher.email) = LOWER(:email)', { email: userEmail })
      .andWhere('teacher.deletedAt IS NULL')
      .getOne();
  }

  async findTeacherByUserId(
    userId: number,
  ): Promise<TeacherEntity | null> {
    try {
      // First try using the teachers service method (which uses email matching)
      const teacher = await this.teachersService.findByUserId(userId);
      if (teacher) {
        // Convert domain Teacher to entity if needed, or return entity directly
        const teacherEntity = await this.teacherRepository.findOne({
          where: { id: teacher.id },
        });
        if (teacherEntity) {
          this.logger.debug(`Found teacher ${teacherEntity.id} for user ${userId} via email matching`);
          return teacherEntity;
        }
      }

      // Fallback: Try to find teacher by checking classes they teach
      // This handles cases where email might not match but teacher is assigned to classes
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`User not found. User ID: ${userId}`);
        return null;
      }

      // Try to find teacher by checking if any classes are assigned to a teacher with matching email
      if (user.email) {
        const teacherByEmail = await this.teacherRepository
          .createQueryBuilder('teacher')
          .where('LOWER(teacher.email) = LOWER(:email)', { email: user.email })
          .andWhere('teacher.deletedAt IS NULL')
          .getOne();
        
        if (teacherByEmail) {
          this.logger.debug(`Found teacher ${teacherByEmail.id} for user ${userId} via email fallback`);
          return teacherByEmail;
        }
      }

      // Last resort: Find teacher by checking classes - if user has teacher role and classes exist
      // This is less reliable but might help in edge cases
      const classesWithTeacher = await this.classRepository
        .createQueryBuilder('class')
        .leftJoin('class.teacher', 'teacher')
        .where('teacher.deletedAt IS NULL')
        .andWhere('class.deletedAt IS NULL')
        .select('teacher.id', 'teacherId')
        .addSelect('teacher.email', 'teacherEmail')
        .distinct(true)
        .getRawMany();

      // Try to match by checking if any teacher email matches user email
      if (user.email) {
        for (const row of classesWithTeacher) {
          if (row.teacherEmail && row.teacherEmail.toLowerCase() === user.email.toLowerCase()) {
            const foundTeacher = await this.teacherRepository.findOne({
              where: { id: row.teacherId },
            });
            if (foundTeacher) {
              this.logger.debug(`Found teacher ${foundTeacher.id} for user ${userId} via class lookup`);
              return foundTeacher;
            }
          }
        }
      }

      this.logger.warn(`Could not find teacher for user ${userId}. User email: ${user.email || 'N/A'}`);
      return null;
    } catch (error) {
      this.logger.error(`Error finding teacher for user ${userId}:`, error);
      return null;
    }
  }

  private async getEnrolledClassCount(studentId: number): Promise<number> {
    return await this.enrollmentRepository.count({
      where: { student: { id: studentId } },
    });
  }

  private async getAttendanceRateForStudent(
    studentId: number,
  ): Promise<number> {
    try {
      const result = await this.attendanceRepository
        .createQueryBuilder('attendance')
        .select(
          'AVG(CASE WHEN attendance.status = :present THEN 100 ELSE 0 END)',
          'rate',
        )
        .setParameter('present', AttendanceStatus.PRESENT)
        .where('attendance.studentId = :studentId', { studentId })
        .andWhere('attendance.deletedAt IS NULL')
        .getRawOne();
      
      // Handle null result (no attendance records) or null rate value
      const rate = result?.rate ?? null;
      if (rate === null || rate === undefined) {
        return 0;
      }
      const parsed = parseFloat(String(rate));
      return isNaN(parsed) ? 0 : parsed;
    } catch (error) {
      console.error(`Error calculating attendance rate for student ${studentId}:`, error);
      return 0;
    }
  }

  private async getAverageGradeForStudent(studentId: number): Promise<number> {
    try {
      const result = await this.performanceRepository
        .createQueryBuilder('performance')
        .select('AVG(performance.score)', 'average')
        .where('performance.studentId = :studentId', { studentId })
        .andWhere('performance.deletedAt IS NULL')
        .getRawOne();
      
      // Handle null result (no performance records) or null average value
      const average = result?.average ?? null;
      if (average === null || average === undefined) {
        return 0;
      }
      const parsed = parseFloat(String(average));
      return isNaN(parsed) ? 0 : parsed;
    } catch (error) {
      console.error(`Error calculating average grade for student ${studentId}:`, error);
      return 0;
    }
  }

  private async getPendingAssignmentsForStudent(
    studentId: number,
  ): Promise<number> {
    // Count assignments that are published and the student hasn't submitted yet
    const assignments = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin('assignment.submissions', 'submission')
      .where('assignment.status = :status', {
        status: AssignmentStatus.PUBLISHED,
      })
      .andWhere(
        '(submission.student.id = :studentId OR submission.student.id IS NULL)',
        { studentId },
      )
      .getCount();
    return assignments;
  }

  private async getCompletedAssignmentsForStudent(
    studentId: number,
  ): Promise<number> {
    // Count assignments that the student has submitted
    return await this.submissionRepository.count({
      where: {
        student: { id: studentId },
        status: SubmissionStatus.SUBMITTED,
      },
    });
  }

  private async getFeeStatusForStudent(studentId: number): Promise<string> {
    const pendingFees = await this.feeRepository.count({
      where: {
        student: { id: studentId },
        status: PaymentStatus.UNPAID,
      },
    });
    return pendingFees > 0 ? 'pending' : 'paid';
  }

  private async getGradeProgressForStudent(studentId: number) {
    // Use Submission table (where teachers actually grade) so dashboard stays in sync
    const result = await this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoin('submission.assignment', 'assignment')
      .leftJoin('assignment.class', 'klass')
      .leftJoin('klass.subject', 'subject')
      .select('subject.name', 'subjectName')
      .addSelect('AVG(submission.score)', 'grade')
      .where('submission.student.id = :studentId', { studentId })
      .andWhere('submission.score IS NOT NULL')
      .groupBy('subject.name')
      .getRawMany();

    return result
      .filter((item) => item.subjectName != null)
      .map((item) => ({
        subject: item.subjectName,
        grade: item.grade != null ? parseFloat(item.grade) : 0,
      }));
  }

  private async getAttendanceCalendarForStudent(studentId: number) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.date', 'date')
      .addSelect('attendance.status', 'status')
      .where('attendance.student.id = :studentId', { studentId })
      .andWhere('attendance.date >= :startDate', { startDate: thirtyDaysAgo })
      .orderBy('attendance.date', 'ASC')
      .getRawMany();

    return result.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      present: item.status === AttendanceStatus.PRESENT,
    }));
  }

  private async getAssignmentStatusForStudent(studentId: number) {
    const result = await this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoin('submission.assignment', 'assignment')
      .select('assignment.title', 'assignmentTitle')
      .addSelect('submission.status', 'status')
      .addSelect('submission.score', 'grade')
      .where('submission.student.id = :studentId', { studentId })
      .getRawMany();

    return result.map((item) => {
      // Map backend status to dashboard display: graded/submitted -> completed
      const rawStatus = item.status as string;
      const displayStatus =
        rawStatus === 'graded' || rawStatus === 'submitted'
          ? 'completed'
          : rawStatus ?? 'pending';
      return {
        assignment: item.assignmentTitle,
        status: displayStatus,
        grade: item.grade != null ? parseFloat(item.grade) : undefined,
      };
    });
  }

  // Helper methods for parent analytics
  private async getChildrenCountForParent(parentId: number): Promise<number> {
    return await this.studentRepository.count({
      where: { parentStudents: { parent: { id: parentId } } },
    });
  }

  private async getAverageAttendanceForParent(
    parentId: number,
  ): Promise<number> {
    const result = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoin('attendance.student', 'student')
      .leftJoin('student.parentStudents', 'parentStudent')
      .select(
        'AVG(CASE WHEN attendance.status = :present THEN 100 ELSE 0 END)',
        'average',
      )
      .setParameter('present', AttendanceStatus.PRESENT)
      .where('parentStudent.parent.id = :parentId', { parentId })
      .getRawOne();
    return parseFloat(result?.average || '0');
  }

  private async getOutstandingFeesForParent(parentId: number): Promise<number> {
    const result = await this.feeRepository
      .createQueryBuilder('fee')
      .leftJoin('fee.student', 'student')
      .leftJoin('student.parentStudents', 'parentStudent')
      .select('SUM(fee.amount)', 'total')
      .where('parentStudent.parent.id = :parentId', { parentId })
      .andWhere('fee.status = :status', { status: PaymentStatus.UNPAID })
      .getRawOne();
    return parseFloat(result?.total || '0');
  }

  private async getUnreadMessagesForParent(parentId: number): Promise<number> {
    // This would need a messages entity - for now return 0
    return 0;
  }

  private async getUpcomingEventsForParent(parentId: number): Promise<number> {
    // This would need an events entity - for now return 0
    return 0;
  }

  private async getRecentPaymentsForParent(parentId: number): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await this.feeRepository.count({
      where: {
        student: { parentStudents: { parent: { id: parentId } } },
        status: PaymentStatus.PAID,
        paidAt: MoreThanOrEqual(thirtyDaysAgo),
      },
    });
  }

  private async getChildrenPerformanceForParent(parentId: number) {
    const result = await this.performanceRepository
      .createQueryBuilder('performance')
      .leftJoin('performance.student', 'student')
      .leftJoin('student.parentStudents', 'parentStudent')
      .leftJoin('performance.assignment', 'assignment')
      .leftJoin('assignment.subject', 'subject')
      .select('student.name', 'childName')
      .addSelect(
        'AVG(CASE WHEN attendance.status = :present THEN 100 ELSE 0 END)',
        'attendance',
      )
      .addSelect('AVG(performance.score)', 'averageGrade')
      .addSelect('subject.name', 'subjectName')
      .addSelect('AVG(performance.score)', 'subjectGrade')
      .setParameter('present', AttendanceStatus.PRESENT)
      .where('parentStudent.parent.id = :parentId', { parentId })
      .groupBy('student.name, subject.name')
      .getRawMany();

    // Group by child
    const childrenMap = new Map();
    result.forEach((item) => {
      if (!childrenMap.has(item.childName)) {
        childrenMap.set(item.childName, {
          child: item.childName,
          attendance: parseFloat(item.attendance),
          averageGrade: parseFloat(item.averageGrade),
          subjects: [],
        });
      }
      childrenMap.get(item.childName).subjects.push({
        subject: item.subjectName,
        grade: parseFloat(item.subjectGrade),
      });
    });

    return Array.from(childrenMap.values());
  }

  private async getFeeHistoryForParent(parentId: number) {
    const result = await this.feeRepository
      .createQueryBuilder('fee')
      .leftJoin('fee.student', 'student')
      .leftJoin('student.parentStudents', 'parentStudent')
      .select('fee.paidAt', 'date')
      .addSelect('fee.amount', 'amount')
      .addSelect('fee.status', 'status')
      .where('parentStudent.parent.id = :parentId', { parentId })
      .orderBy('fee.paidAt', 'DESC')
      .getRawMany();

    return result.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      amount: parseFloat(item.amount),
      status: item.status,
    }));
  }

  // Super Admin Dashboard Methods
  async getSuperAdminStats(): Promise<SuperAdminStatsDto> {
    const [
      userBreakdown,
      storageStats,
      systemHealth,
      totalClasses,
      totalParents,
      totalRevenue,
      pendingFees,
    ] = await Promise.all([
      this.getUserRoleBreakdown(),
      this.getStorageStats(),
      this.getSystemHealth(),
      this.classRepository.count(),
      this.parentRepository.count(),
      this.getTotalRevenue(),
      this.getPendingFees(),
    ]);

    return {
      userBreakdown,
      storageStats,
      systemHealth,
      totalClasses,
      totalParents,
      totalRevenue,
      pendingFees,
    };
  }

  private async getUserRoleBreakdown() {
    const [
      totalUsers,
      students,
      teachers,
      admins,
      superAdmins,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({
        where: { role: { id: RoleEnum.user } },
      }),
      this.userRepository.count({
        where: { role: { id: RoleEnum.teacher } },
      }),
      this.userRepository.count({
        where: { role: { id: RoleEnum.admin } },
      }),
      this.userRepository.count({
        where: { role: { id: RoleEnum.superAdmin } },
      }),
    ]);

    return {
      totalUsers,
      students,
      teachers,
      admins,
      superAdmins,
    };
  }

  private async getStorageStats() {
    try {
      const result = await this.fileRepository
        .createQueryBuilder('file')
        .select('SUM(file.size)', 'totalSize')
        .addSelect('COUNT(file.id)', 'totalFiles')
        .where('file.deletedAt IS NULL')
        .getRawOne();

      const totalStorageBytes = parseInt(result?.totalSize || '0', 10);
      const totalFiles = parseInt(result?.totalFiles || '0', 10);

      // Format storage size
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
      };

      // Get storage provider from config
      const fileDriver = this.configService.get<FileDriver>('file.driver', { infer: true }) || FileDriver.LOCAL;
      let storageProvider = 'LOCAL';
      
      if (fileDriver === FileDriver.S3 || fileDriver === FileDriver.S3_PRESIGNED) {
        storageProvider = 'S3';
      } else if (fileDriver === FileDriver.B2 || fileDriver === FileDriver.B2_PRESIGNED) {
        storageProvider = 'B2';
      } else if (fileDriver === FileDriver.AZURE_BLOB_SAS) {
        storageProvider = 'Azure Blob';
      }

      return {
        totalStorageBytes,
        totalStorageFormatted: formatBytes(totalStorageBytes),
        totalFiles,
        storageProvider,
      };
    } catch (error) {
      // Return defaults if there's an error
      return {
        totalStorageBytes: 0,
        totalStorageFormatted: '0 Bytes',
        totalFiles: 0,
        storageProvider: 'Unknown',
      };
    }
  }

  private async getSystemHealth() {
    try {
      // Check database connection by running a simple query
      await this.userRepository.count();
      const databaseConnected = true;

      // Check storage by checking if we can query files
      await this.fileRepository.count();
      const storageConnected = true;

      // Check Redis connection by attempting a simple operation
      // First check if Redis is enabled in config
      const redisEnabled = this.configService.get('redis.enabled', { infer: true }) ?? false;
      let redisConnected = false;
      
      if (redisEnabled) {
        try {
          const testKey = 'health-check-' + Date.now();
          await this.redisService.set(testKey, 'test', 1);
          const value = await this.redisService.get(testKey);
          await this.redisService.delete(testKey);
          redisConnected = value === 'test';
        } catch (error) {
          redisConnected = false;
        }
      } else {
        // Redis is disabled, so we don't check connection
        // We'll mark it as connected=false but won't affect overall health
        redisConnected = false;
      }

      // Determine overall health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = 'All systems operational';

      const disconnectedServices: string[] = [];
      if (!databaseConnected) disconnectedServices.push('Database');
      if (!storageConnected) disconnectedServices.push('Storage');
      if (!redisConnected) disconnectedServices.push('Redis');

      if (disconnectedServices.length > 0) {
        if (disconnectedServices.length === 1 && disconnectedServices[0] === 'Redis') {
          // Redis is optional, so if only Redis is down, mark as degraded
          status = 'degraded';
          message = 'Redis is unavailable, but core systems are operational';
        } else {
          status = 'unhealthy';
          message = `${disconnectedServices.join(', ')} ${disconnectedServices.length === 1 ? 'is' : 'are'} experiencing issues`;
        }
      }

      return {
        status,
        databaseConnected,
        storageConnected,
        redisConnected,
        message,
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        databaseConnected: false,
        storageConnected: false,
        redisConnected: false,
        message: 'System health check failed',
      };
    }
  }
}
