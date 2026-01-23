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
  Request,
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
import { BulkCreateClassesDto } from './dto/bulk-create-classes.dto';
import { TeachersService } from '../teachers/teachers.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Classes')
@Controller({
  path: 'classes',
  version: '1',
})
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly teachersService: TeachersService,
  ) {}

  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createClassDto: CreateClassDto): Promise<Class> {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher, RoleEnum.user)
  @ApiOkResponse({
    type: InfinityPaginationResponseDto,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async findAll(
    @Query() query: QueryClassDto,
    @Request() req,
  ): Promise<InfinityPaginationResponseDto<Class>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    // Parse filters from query string if provided
    let filters = query?.filters ?? null;
    
    // If user is a teacher, enforce filtering by their teacher ID
    const userRole = req.user?.role?.id;
    if (userRole === RoleEnum.teacher) {
      // Find teacher by user email
      const teacher = await this.teachersService.findByEmail(req.user?.email);
      
      if (teacher?.id) {
        // Merge teacher filter with existing filters
        if (!filters) {
          filters = { teacherId: teacher.id };
        } else {
          // Ensure teacherId is set to the current teacher's ID
          // This prevents teachers from seeing other teachers' classes
          filters.teacherId = teacher.id;
        }
      }
    }

    const data = await this.classesService.findManyWithPagination({
      filterOptions: filters,
      sortOptions: query?.sort ?? null,
      paginationOptions: {
        page,
        limit,
      },
    });

    return infinityPagination(data, { page, limit });
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher, RoleEnum.user)
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
  async findOne(@Param('id') id: string, @Request() req): Promise<NullableType<Class>> {
    const classEntity = await this.classesService.findById(+id);
    
    // If user is a teacher, ensure they can only access their own classes
    const userRole = req.user?.role?.id;
    if (userRole === RoleEnum.teacher && classEntity) {
      const teacher = await this.teachersService.findByEmail(req.user?.email);
      
      if (teacher?.id && classEntity.teacher?.id !== teacher.id) {
        // Teacher is trying to access a class that doesn't belong to them
        return null;
      }
    }
    
    return classEntity;
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
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
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
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
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
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
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher, RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiOkResponse({
    description: 'Class enrollments retrieved successfully',
  })
  getEnrollments(@Param('id') classId: string): Promise<any[]> {
    return this.classesService.getEnrollments(+classId);
  }

  // Bulk enroll endpoint
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
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
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({
    summary: 'Bulk create classes from JSON data',
    description: 'Send an array of class objects to bulk create classes',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk creation processed successfully',
    type: BulkClassesResultDto,
  })
  async bulkCreate(
    @Body() bulkCreateDto: BulkCreateClassesDto,
  ): Promise<BulkClassesResultDto> {
    return this.classesService.bulkCreateFromData(
      bulkCreateDto.classes,
      bulkCreateDto.duplicateHandling || 'skip',
    );
  }
}
