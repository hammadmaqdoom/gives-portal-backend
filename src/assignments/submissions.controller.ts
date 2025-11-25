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
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
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
import { Submission } from './domain/submission';
import { SubmissionsService } from './submissions.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Submissions')
@Controller({
  path: 'submissions',
  version: '1',
})
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: Submission,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  create(
    @Body() createSubmissionDto: CreateSubmissionDto,
  ): Promise<Submission> {
    return this.submissionsService.create(createSubmissionDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponseDto,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async findAll(
    @Query() query: any,
  ): Promise<InfinityPaginationResponseDto<Submission>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const data = await this.submissionsService.findManyWithPagination({
      filterOptions: query?.filters ?? null,
      sortOptions: query?.sort ?? null,
      paginationOptions: {
        page,
        limit,
      },
    });

    return infinityPagination(data, { page, limit });
  }

  @Get('assignment/:assignmentId')
  @ApiParam({
    name: 'assignmentId',
    type: String,
  })
  @ApiOkResponse({
    type: [Submission],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByAssignment(
    @Param('assignmentId') assignmentId: string,
  ): Promise<Submission[]> {
    return this.submissionsService.findByAssignment(+assignmentId);
  }

  @Get('student/:studentId')
  @ApiParam({
    name: 'studentId',
    type: String,
  })
  @ApiOkResponse({
    type: [Submission],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByStudent(@Param('studentId') studentId: string): Promise<Submission[]> {
    return this.submissionsService.findByStudent(+studentId);
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
    type: Submission,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByStudentAndAssignment(
    @Param('studentId') studentId: string,
    @Param('assignmentId') assignmentId: string,
  ): Promise<NullableType<Submission>> {
    return this.submissionsService.findByStudentAndAssignment(
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
    type: Submission,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findOne(@Param('id') id: string): Promise<NullableType<Submission>> {
    return this.submissionsService.findById(+id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Submission,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  update(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<Submission | null> {
    return this.submissionsService.update(+id, updateSubmissionDto);
  }

  @Patch(':id/grade')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Submission,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  gradeSubmission(
    @Param('id') id: string,
    @Body() gradeData: { score: number; grade: string; comments?: string },
  ): Promise<Submission | null> {
    return this.submissionsService.gradeSubmission(
      +id,
      gradeData.score,
      gradeData.grade,
      gradeData.comments,
    );
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.submissionsService.remove(+id);
  }

  @Get(':id/annotations')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    description: 'Get annotations for a submission',
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  getAnnotations(@Param('id') id: string) {
    // For now, return empty annotations
    // In a real implementation, you'd fetch from a database
    return {
      submissionId: id,
      annotations: [],
    };
  }

  @Post(':id/annotations')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    description: 'Save annotations for a submission',
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  saveAnnotations(
    @Param('id') id: string,
    @Body() annotationData: { fileId: string; annotations: any[] },
  ) {
    // For now, just return success
    // In a real implementation, you'd save to a database
    console.log(`Saving annotations for submission ${id}:`, annotationData);
    return {
      message: 'Annotations saved successfully',
      submissionId: id,
      savedAnnotations: annotationData.annotations.length,
    };
  }
}
