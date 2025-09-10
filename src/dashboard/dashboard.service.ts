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

@Injectable()
export class DashboardService {
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
    return parseFloat(result?.total || '0');
  }

  private async getPendingFees(): Promise<number> {
    const result = await this.feeRepository
      .createQueryBuilder('fee')
      .select('SUM(fee.amount)', 'total')
      .where('fee.status = :status', { status: PaymentStatus.UNPAID })
      .getRawOne();
    return parseFloat(result?.total || '0');
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

    return result.map((item) => ({
      month: new Date(item.month).toLocaleDateString('en-US', {
        month: 'short',
      }),
      revenue: parseFloat(item.total),
    }));
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
      .where('class.teacher.id = :teacherId', { teacherId })
      .getRawOne();
    return parseFloat(result?.average || '0');
  }

  private async getPendingAssignmentsForTeacher(
    teacherId: number,
  ): Promise<number> {
    try {
      return await this.assignmentRepository.count({
        where: {
          teacher: { id: teacherId },
          status: AssignmentStatus.PUBLISHED,
        },
      });
    } catch (error) {
      // Fallback when assignment table/columns are missing
      return 0;
    }
  }

  private async getCompletedAssignmentsForTeacher(
    teacherId: number,
  ): Promise<number> {
    try {
      return await this.assignmentRepository.count({
        where: { teacher: { id: teacherId }, status: AssignmentStatus.CLOSED },
      });
    } catch (error) {
      // Fallback when assignment table/columns are missing
      return 0;
    }
  }

  private async getAverageGradeForTeacher(teacherId: number): Promise<number> {
    const result = await this.performanceRepository
      .createQueryBuilder('performance')
      .leftJoin('performance.assignment', 'assignment')
      .select('AVG(performance.score)', 'average')
      .where('assignment.teacher.id = :teacherId', { teacherId })
      .getRawOne();
    return parseFloat(result?.average || '0');
  }

  private async getClassAttendanceForTeacher(teacherId: number) {
    const result = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoin('attendance.class', 'class')
      .select('class.name', 'className')
      .addSelect(
        'AVG(CASE WHEN attendance.status = :present THEN 100 ELSE 0 END)',
        'attendance',
      )
      .setParameter('present', AttendanceStatus.PRESENT)
      .where('class.teacher.id = :teacherId', { teacherId })
      .groupBy('class.name')
      .getRawMany();

    return result.map((item) => ({
      class: item.className,
      attendance: parseFloat(item.attendance),
    }));
  }

  private async getStudentPerformanceForTeacher(teacherId: number) {
    const result = await this.performanceRepository
      .createQueryBuilder('performance')
      .leftJoin('performance.student', 'student')
      .leftJoin('performance.assignment', 'assignment')
      .select('student.name', 'studentName')
      .addSelect('AVG(performance.score)', 'grade')
      .where('assignment.teacher.id = :teacherId', { teacherId })
      .groupBy('student.name')
      .getRawMany();

    return result.map((item) => ({
      student: item.studentName,
      grade: parseFloat(item.grade),
    }));
  }

  private async getAssignmentStatusForTeacher(teacherId: number) {
    try {
      const result = await this.assignmentRepository
        .createQueryBuilder('assignment')
        // Some deployments may not have submissions; guard join in try/catch
        .leftJoin('assignment.submissions', 'submission')
        .select('assignment.title', 'assignmentTitle')
        .addSelect('COUNT(submission.id)', 'submitted')
        .addSelect('assignment.totalStudents', 'total')
        .where('assignment.teacher.id = :teacherId', { teacherId })
        .groupBy('assignment.id')
        .getRawMany();

      return result.map((item) => ({
        assignment: item.assignmentTitle,
        submitted: parseInt(item.submitted),
        total: parseInt(item.total),
      }));
    } catch (error) {
      // Fallback when submissions table or assignment columns are missing
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
    return await this.teacherRepository.findOne({
      where: { email: userEmail },
    });
  }

  private async getEnrolledClassCount(studentId: number): Promise<number> {
    return await this.enrollmentRepository.count({
      where: { student: { id: studentId } },
    });
  }

  private async getAttendanceRateForStudent(
    studentId: number,
  ): Promise<number> {
    const result = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select(
        'AVG(CASE WHEN attendance.status = :present THEN 100 ELSE 0 END)',
        'rate',
      )
      .setParameter('present', AttendanceStatus.PRESENT)
      .where('attendance.student.id = :studentId', { studentId })
      .getRawOne();
    return parseFloat(result?.rate || '0');
  }

  private async getAverageGradeForStudent(studentId: number): Promise<number> {
    const result = await this.performanceRepository
      .createQueryBuilder('performance')
      .select('AVG(performance.score)', 'average')
      .where('performance.student.id = :studentId', { studentId })
      .getRawOne();
    return parseFloat(result?.average || '0');
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
    const result = await this.performanceRepository
      .createQueryBuilder('performance')
      .leftJoin('performance.assignment', 'assignment')
      .leftJoin('assignment.class', 'klass')
      .leftJoin('klass.subject', 'subject')
      .select('subject.name', 'subjectName')
      .addSelect('AVG(performance.score)', 'grade')
      .where('performance.student.id = :studentId', { studentId })
      .groupBy('subject.name')
      .getRawMany();

    return result.map((item) => ({
      subject: item.subjectName,
      grade: parseFloat(item.grade),
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

    return result.map((item) => ({
      assignment: item.assignmentTitle,
      status: item.status,
      grade: item.grade ? parseFloat(item.grade) : undefined,
    }));
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
}
