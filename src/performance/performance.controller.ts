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
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto } from './dto/update-performance.dto';
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
import { QueryPerformanceDto } from './dto/query-performance.dto';
import { Performance } from './domain/performance';
import { PerformanceService } from './performance.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiBearerAuth()
@Roles(RoleEnum.admin, RoleEnum.teacher)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Performance')
@Controller({
  path: 'performance',
  version: '1',
})
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createPerformanceDto: CreatePerformanceDto,
  ): Promise<Performance> {
    return this.performanceService.create(createPerformanceDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponseDto,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async findAll(
    @Query() query: QueryPerformanceDto,
  ): Promise<InfinityPaginationResponseDto<Performance>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const data = await this.performanceService.findManyWithPagination({
      filterOptions: query?.filters ?? null,
      sortOptions: query?.sort ?? null,
      paginationOptions: {
        page,
        limit,
      },
    });

    return infinityPagination(data, { page, limit });
  }

  @Get('student/:studentId')
  @ApiParam({
    name: 'studentId',
    type: String,
  })
  @ApiOkResponse({
    type: [Performance],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByStudent(@Param('studentId') studentId: string): Promise<Performance[]> {
    return this.performanceService.findByStudent(+studentId);
  }

  @Get('assignment/:assignmentId')
  @ApiParam({
    name: 'assignmentId',
    type: String,
  })
  @ApiOkResponse({
    type: [Performance],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByAssignment(
    @Param('assignmentId') assignmentId: string,
  ): Promise<Performance[]> {
    return this.performanceService.findByAssignment(+assignmentId);
  }

  // Grades helpers expected by frontend
  @Get('grades/student/:studentId')
  @ApiParam({ name: 'studentId', type: String })
  @ApiOkResponse({ type: [Performance] })
  getStudentGrades(@Param('studentId') studentId: string) {
    return this.performanceService.findByStudent(+studentId);
  }

  @Get('student/:studentId/assignment/:assignmentId')
  @ApiParam({
    name: 'studentId',
    type: String,
  })
  @ApiParam({
    name: 'assignmentId',
    type: String,
  })
  @ApiOkResponse({
    type: Performance,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByStudentAndAssignment(
    @Param('studentId') studentId: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<NullableType<Performance>> {
    return this.performanceService.findByStudentAndAssignment(
      +studentId,
      +assignmentId,
    );
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Performance,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findOne(@Param('id') id: string): Promise<NullableType<Performance>> {
    return this.performanceService.findById(+id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Performance,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  update(
    @Param('id') id: string,
    @Body() updatePerformanceDto: UpdatePerformanceDto,
  ): Promise<Performance | null> {
    return this.performanceService.update(+id, updatePerformanceDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.performanceService.remove(+id);
  }
}
