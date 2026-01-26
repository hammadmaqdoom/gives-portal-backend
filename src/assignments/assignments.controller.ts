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
  Req,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
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
import { QueryAssignmentDto } from './dto/query-assignment.dto';
import { Assignment } from './domain/assignment';
import { AssignmentsService } from './assignments.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';
import { FilesService } from '../files/files.service';
import { FileStorageService } from '../files/file-storage.service';
import { ConfigService } from '@nestjs/config';
import { FileDriver } from '../files/config/file-config.type';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Assignments')
@Controller({
  path: 'assignments',
  version: '1',
})
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    @Inject(forwardRef(() => FilesService))
    private readonly filesService: FilesService,
    private readonly fileStorageService: FileStorageService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @Req() req: any,
  ): Promise<Assignment> {
    return this.assignmentsService.create(createAssignmentDto, req?.user);
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user, RoleEnum.superAdmin)
  @ApiOkResponse({
    type: InfinityPaginationResponseDto,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async findAll(
    @Query() query: QueryAssignmentDto,
  ): Promise<InfinityPaginationResponseDto<Assignment>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const data = await this.assignmentsService.findManyWithPagination({
      filterOptions: query?.filters ?? null,
      sortOptions: query?.sort ?? null,
      paginationOptions: {
        page,
        limit,
      },
    });

    return infinityPagination(data, { page, limit });
  }

  @Get('class/:classId')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user, RoleEnum.superAdmin)
  @ApiParam({
    name: 'classId',
    type: String,
  })
  @ApiOkResponse({
    type: [Assignment],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByClass(@Param('classId') classId: string): Promise<Assignment[]> {
    return this.assignmentsService.findByClass(+classId);
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user, RoleEnum.superAdmin)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Assignment,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async findOne(@Param('id') id: string): Promise<any> {
    const assignment = await this.assignmentsService.findById(+id);
    
    if (!assignment) {
      return null;
    }

    // Fetch files associated with this assignment
    const files = await this.filesService.getFilesByContext('assignment', id);
    
    // Generate URLs for all files
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const fileDriver = await this.fileStorageService.getDriver();
        const baseUrl = this.getBaseUrl();
        const isVideo = file.mimeType?.startsWith('video/') ||
          /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v)$/i.test(file.path);

        // For videos or local files, use serve endpoint
        if (isVideo || fileDriver === FileDriver.LOCAL) {
          return {
            id: file.id,
            filename: file.filename,
            originalName: file.originalName,
            path: file.path,
            size: file.size,
            mimeType: file.mimeType,
            uploadedAt: file.uploadedAt,
            url: `${baseUrl}/api/v1/files/serve/${file.id}`,
          };
        }

        // For S3/B2 non-video files, generate presigned URL
        if (
          fileDriver === FileDriver.S3 ||
          fileDriver === FileDriver.S3_PRESIGNED ||
          fileDriver === FileDriver.B2 ||
          fileDriver === FileDriver.B2_PRESIGNED
        ) {
          try {
            const presignedUrl = await this.fileStorageService.getPresignedFileUrl(
              file.path,
              86400, // 24 hours expiry
            );
            return {
              id: file.id,
              filename: file.filename,
              originalName: file.originalName,
              path: file.path,
              size: file.size,
              mimeType: file.mimeType,
              uploadedAt: file.uploadedAt,
              url: presignedUrl,
            };
          } catch (error) {
            console.error('Error generating presigned URL:', error);
            return {
              id: file.id,
              filename: file.filename,
              originalName: file.originalName,
              path: file.path,
              size: file.size,
              mimeType: file.mimeType,
              uploadedAt: file.uploadedAt,
              url: `${baseUrl}/api/v1/files/serve/${file.id}`,
            };
          }
        }

        // Fallback
        return {
          id: file.id,
          filename: file.filename,
          originalName: file.originalName,
          path: file.path,
          size: file.size,
          mimeType: file.mimeType,
          uploadedAt: file.uploadedAt,
          url: `${baseUrl}/api/v1/files/serve/${file.id}`,
        };
      }),
    );

    // Return assignment with files included
    return {
      ...assignment,
      attachments: filesWithUrls,
    };
  }

  /**
   * Get base URL for the current server
   */
  private getBaseUrl(): string {
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || '3000';
    return `${protocol}://${host}:${port}`;
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.superAdmin)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Assignment,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  update(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ): Promise<Assignment | null> {
    return this.assignmentsService.update(+id, updateAssignmentDto);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.superAdmin)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.assignmentsService.remove(+id);
  }
}
