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
  Patch,
  Post,
  Query,
  Request,
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
import { ActorContext, FaceEmbeddingsService } from './face-embeddings.service';
import { CreateFaceEmbeddingDto } from './dto/create-face-embedding.dto';
import {
  ClassFaceEmbeddingsResponseDto,
  FaceEmbeddingSummaryDto,
} from './dto/face-embedding-response.dto';
import { StudentFaceEmbedding } from './domain/student-face-embedding';
import { UpdateBiometricConsentDto } from './dto/update-biometric-consent.dto';

function actorFromRequest(req: any): ActorContext {
  return {
    userId: req?.user?.id ?? null,
    userEmail: req?.user?.email ?? null,
    userRole:
      (typeof req?.user?.role === 'object' ? req?.user?.role?.name : req?.user?.role) ??
      null,
    ipAddress:
      req?.ip ??
      (req?.headers?.['x-forwarded-for'] as string | undefined) ??
      null,
    userAgent: (req?.headers?.['user-agent'] as string | undefined) ?? null,
  };
}

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
    @Request() req: any,
  ): Promise<FaceEmbeddingSummaryDto> {
    const created = await this.faceEmbeddingsService.create(
      studentId,
      dto,
      actorFromRequest(req),
    );
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
    @Request() req: any,
  ): Promise<void> {
    await this.faceEmbeddingsService.remove(
      studentId,
      embeddingId,
      actorFromRequest(req),
    );
  }

  @Delete('students/:id/face-embeddings')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all face samples for a student' })
  async removeAll(
    @Param('id', ParseIntPipe) studentId: number,
    @Request() req: any,
  ): Promise<void> {
    await this.faceEmbeddingsService.removeAllForStudent(
      studentId,
      actorFromRequest(req),
    );
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

  @Patch('students/:id/biometric-consent')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Grant or revoke biometric (face-recognition) consent for a student. Revocation wipes enrolled samples.',
  })
  @ApiParam({ name: 'id', type: Number })
  async updateConsent(
    @Param('id', ParseIntPipe) studentId: number,
    @Body() dto: UpdateBiometricConsentDto,
    @Request() req: any,
  ) {
    return this.faceEmbeddingsService.updateBiometricConsent(
      studentId,
      dto.consent,
      actorFromRequest(req),
      dto.note,
    );
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
