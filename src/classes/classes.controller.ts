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
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
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
import { QueryClassDto } from './dto/query-class.dto';
import { Class } from './domain/class';
import { ClassesService } from './classes.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';

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
}
