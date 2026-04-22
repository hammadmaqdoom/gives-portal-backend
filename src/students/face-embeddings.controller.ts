import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { FaceEmbeddingsService } from './face-embeddings.service';
import { CreateFaceEmbeddingDto } from './dto/create-face-embedding.dto';
import {
  ClassFaceEmbeddingsResponseDto,
  FaceEmbeddingSummaryDto,
} from './dto/face-embedding-response.dto';
import { StudentFaceEmbedding } from './domain/student-face-embedding';

@ApiTags('Face Embeddings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ version: '1' })
export class FaceEmbeddingsController {
  constructor(
    private readonly faceEmbeddingsService: FaceEmbeddingsService,
  ) {}

  @Post('students/:id/face-embeddings')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Enroll a new face sample for a student' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: HttpStatus.CREATED, type: FaceEmbeddingSummaryDto })
  async create(
    @Param('id', ParseIntPipe) studentId: number,
    @Body() dto: CreateFaceEmbeddingDto,
  ): Promise<FaceEmbeddingSummaryDto> {
    const created = await this.faceEmbeddingsService.create(studentId, dto);
    return this.toSummary(created);
  }

  @Get('students/:id/face-embeddings')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher)
  @ApiOperation({ summary: 'List face samples for a student (metadata only)' })
  @ApiParam({ name: 'id', type: Number })
  async findByStudent(
    @Param('id', ParseIntPipe) studentId: number,
    @Query('includeVector', new ParseBoolPipe({ optional: true }))
    includeVector?: boolean,
  ): Promise<FaceEmbeddingSummaryDto[] | StudentFaceEmbedding[]> {
    const embeddings = await this.faceEmbeddingsService.findByStudentId(
      studentId,
      includeVector ?? false,
    );
    if (includeVector) return embeddings;
    return embeddings.map((e) => this.toSummary(e));
  }

  @Delete('students/:id/face-embeddings/:embeddingId')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a single face sample' })
  async remove(
    @Param('id', ParseIntPipe) studentId: number,
    @Param('embeddingId', ParseIntPipe) embeddingId: number,
  ): Promise<void> {
    await this.faceEmbeddingsService.remove(studentId, embeddingId);
  }

  @Delete('students/:id/face-embeddings')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all face samples for a student' })
  async removeAll(
    @Param('id', ParseIntPipe) studentId: number,
  ): Promise<void> {
    await this.faceEmbeddingsService.removeAllForStudent(studentId);
  }

  @Get('classes/:classId/face-embeddings')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher)
  @ApiOperation({
    summary:
      'Fetch all enrolled face descriptors for students in a class (used by Quick Attendance)',
  })
  @ApiParam({ name: 'classId', type: Number })
  @ApiResponse({ status: HttpStatus.OK, type: ClassFaceEmbeddingsResponseDto })
  async findByClass(
    @Param('classId', ParseIntPipe) classId: number,
  ): Promise<ClassFaceEmbeddingsResponseDto> {
    return this.faceEmbeddingsService.getClassEmbeddings(classId);
  }

  private toSummary(e: StudentFaceEmbedding): FaceEmbeddingSummaryDto {
    return {
      id: e.id,
      studentId: e.studentId,
      modelName: e.modelName,
      qualityScore: e.qualityScore ?? null,
      sourceFileId: e.sourceFileId ?? null,
      createdAt: e.createdAt,
    };
  }
}
