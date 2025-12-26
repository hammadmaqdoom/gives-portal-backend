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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
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
import { QueryClassDto } from './dto/query-class.dto';
import { Class } from './domain/class';
import { ClassesService } from './classes.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';
import { BulkClassesResultDto } from './dto/bulk-classes-response.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Classes')
@Controller({
  path: 'classes',
  version: '1',
})
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Roles(RoleEnum.admin)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createClassDto: CreateClassDto): Promise<Class> {
    return this.classesService.create(createClassDto);
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
    @Query() query: QueryClassDto,
  ): Promise<InfinityPaginationResponseDto<Class>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const data = await this.classesService.findManyWithPagination({
      filterOptions: query?.filters ?? null,
      sortOptions: query?.sort ?? null,
      paginationOptions: {
        page,
        limit,
      },
    });

    return infinityPagination(data, { page, limit });
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Class,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findOne(@Param('id') id: string): Promise<NullableType<Class>> {
    return this.classesService.findById(+id);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Class,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  update(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
  ): Promise<Class | null> {
    return this.classesService.update(+id, updateClassDto);
  }

  @Patch(':id/public-sale')
  @Roles(RoleEnum.admin)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Class,
    description: 'Toggle public sale status for a class',
  })
  async togglePublicSale(
    @Param('id') id: string,
    @Body() body: { isPublicForSale: boolean },
  ): Promise<Class | null> {
    return this.classesService.update(+id, {
      isPublicForSale: body.isPublicForSale,
    } as any);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.classesService.remove(+id);
  }

  // Duplicate class
  @Post(':id/duplicate')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'id', type: String })
  async duplicate(@Param('id') id: string): Promise<Class> {
    return this.classesService.duplicate(+id);
  }

  // New enrollment endpoint
  @Get(':id/enrollments')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiOkResponse({
    description: 'Class enrollments retrieved successfully',
  })
  getEnrollments(@Param('id') classId: string): Promise<any[]> {
    return this.classesService.getEnrollments(+classId);
  }

  // Bulk enroll endpoint
  @Roles(RoleEnum.admin)
  @Post(':id/enrollments/bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiOkResponse({ description: 'Students enrolled in class successfully' })
  bulkEnroll(
    @Param('id') classId: string,
    @Body()
    body: { studentIds: number[]; status?: string; enrollmentDate?: string },
  ): Promise<{ count: number }> {
    return this.classesService.bulkEnroll(+classId, body);
  }

  @Post('bulk-create')
  @Roles(RoleEnum.admin)
  @ApiOperation({
    summary: 'Bulk create classes from Excel/CSV file',
    description:
      'Upload an Excel or CSV file with class details to bulk create classes',
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
            'Excel (.xlsx, .xls) or CSV file with class data (Name, Batch/Term, Subject ID, Teacher ID, Fees, etc.)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk creation processed successfully',
    type: BulkClassesResultDto,
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
  ): Promise<BulkClassesResultDto> {
    return this.classesService.bulkCreateFromFile(file);
  }
}
