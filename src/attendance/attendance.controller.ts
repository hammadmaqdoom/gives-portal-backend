import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  HttpCode,
  SerializeOptions,
} from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { Attendance } from './domain/attendance';
import { AttendanceService } from './attendance.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Attendance')
@Controller({
  path: 'attendance',
  version: '1',
})
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createAttendanceDto: CreateAttendanceDto,
  ): Promise<Attendance> {
    return this.attendanceService.create(createAttendanceDto);
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOkResponse({
    type: InfinityPaginationResponseDto,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async findAll(
    @Query() query: QueryAttendanceDto,
  ): Promise<InfinityPaginationResponseDto<Attendance>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const data = await this.attendanceService.findManyWithPagination({
      filterOptions: query?.filters ?? null,
      sortOptions: query?.sort ?? null,
      paginationOptions: {
        page,
        limit,
      },
    });

    return infinityPagination(data, { page, limit });
  }

  @Get('student/:studentId/date/:date')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiParam({
    name: 'studentId',
    type: String,
  })
  @ApiParam({
    name: 'date',
    type: String,
  })
  @ApiOkResponse({
    type: Attendance,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByStudentAndDate(
    @Param('studentId') studentId: string,
    @Param('date') date: string,
  ): Promise<NullableType<Attendance>> {
    return this.attendanceService.findByStudentAndDate(
      +studentId,
      new Date(date),
    );
  }

  @Get('class/:classId/date/:date')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiParam({
    name: 'classId',
    type: String,
  })
  @ApiParam({
    name: 'date',
    type: String,
  })
  @ApiOkResponse({
    type: [Attendance],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByClassAndDate(
    @Param('classId') classId: string,
    @Param('date') date: string,
  ): Promise<Attendance[]> {
    return this.attendanceService.findByClassAndDate(+classId, new Date(date));
  }

  @Get('by-date')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOkResponse({
    type: [Attendance],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByDate(
    @Query('date') date: string,
    @Query('classId') classId?: string,
    @Query('studentId') studentId?: string,
  ): Promise<Attendance[] | NullableType<Attendance>> {
    return this.attendanceService.findByDate(new Date(date), classId ? +classId : undefined, studentId ? +studentId : undefined);
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Attendance,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findOne(@Param('id') id: string): Promise<NullableType<Attendance>> {
    return this.attendanceService.findById(+id);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Attendance,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  update(
    @Param('id') id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<Attendance | null> {
    return this.attendanceService.update(+id, updateAttendanceDto);
  }

  @Post('bulk-update')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @HttpCode(HttpStatus.OK)
  bulkUpdate(
    @Body()
    body: { items: Array<Partial<CreateAttendanceDto & UpdateAttendanceDto> & { id?: number }> },
  ): Promise<{ updated: number; created: number }> {
    return this.attendanceService.bulkUpdate(body?.items ?? []);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.attendanceService.remove(+id);
  }
}
