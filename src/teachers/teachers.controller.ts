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
  ClassSerializerInterceptor,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { Teacher } from './domain/teacher';
import { TeachersService } from './teachers.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';
import { BulkTeachersResultDto } from './dto/bulk-teachers-response.dto';

@ApiTags('Teachers')
@Controller({
  path: 'teachers',
  version: '1',
})
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  // Public endpoint - no authentication required
  @Get('public')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: [Teacher],
  })
  findPublicTeachers(): Promise<Teacher[]> {
    return this.teachersService.findPublicTeachers();
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTeacherDto: CreateTeacherDto,
  ): Promise<{ teacher: Teacher; user: any; tempPassword: string | null }> {
    return this.teachersService.create(createTeacherDto);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Object,
  })
  resetPassword(@Param('id') id: string): Promise<{ tempPassword: string }> {
    return this.teachersService.resetPassword(+id);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get(':id/check-user-account')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Object,
  })
  checkTeacherUserAccount(
    @Param('id') id: string,
  ): Promise<{ teacher: Teacher | null; user: any; hasUserAccount: boolean }> {
    return this.teachersService.checkTeacherUserAccount(+id);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponseDto,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async findAll(
    @Query() query: QueryTeacherDto,
  ): Promise<InfinityPaginationResponseDto<Teacher>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const data = await this.teachersService.findManyWithPagination({
      filterOptions: query?.filters ?? null,
      sortOptions: query?.sort ?? null,
      paginationOptions: {
        page,
        limit,
      },
    });

    return infinityPagination(data, { page, limit });
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Teacher,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findOne(@Param('id') id: string): Promise<NullableType<Teacher>> {
    return this.teachersService.findById(+id);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Object,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  update(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ): Promise<{
    teacher: Teacher | null;
    tempPassword?: string;
    userAccountCreated: boolean;
  }> {
    return this.teachersService.update(+id, updateTeacherDto);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.teachersService.remove(+id);
  }

  @Post('bulk-create')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiOperation({
    summary: 'Bulk create teachers from Excel/CSV file',
    description:
      'Upload an Excel or CSV file with teacher details to bulk create teachers. User accounts will be created for teachers with email addresses.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Excel (.xlsx, .xls) or CSV file with teacher data (Name, Email, Phone, Commission %, Subjects Allowed, etc.)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk creation processed successfully',
    type: BulkTeachersResultDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async bulkCreate(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            // Accept CSV, XLS, and XLSX MIME types
            fileType:
              /(text\/csv|application\/csv|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<BulkTeachersResultDto> {
    return this.teachersService.bulkCreateFromFile(file);
  }
}
