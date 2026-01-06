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
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
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
import { QuerySubjectDto } from './dto/query-subject.dto';
import { Subject } from './domain/subject';
import { SubjectsService } from './subjects.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';
import { BulkSubjectsResultDto } from './dto/bulk-subjects-response.dto';
import { BulkCreateSubjectsDto } from './dto/bulk-create-subjects.dto';

@ApiTags('Subjects')
@Controller({
  path: 'subjects',
  version: '1',
})
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  // Public endpoint for subjects list
  @Get('public')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: [Subject],
  })
  async findPublicSubjects(): Promise<Subject[]> {
    const data = await this.subjectsService.findManyWithPagination({
      filterOptions: null,
      sortOptions: [{ orderBy: 'name', order: 'asc' }],
      paginationOptions: {
        page: 1,
        limit: 1000, // Get all subjects for public display
      },
    });
    return data;
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSubjectDto: CreateSubjectDto): Promise<Subject> {
    return this.subjectsService.create(createSubjectDto);
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
    @Query() query: QuerySubjectDto,
  ): Promise<InfinityPaginationResponseDto<Subject>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const data = await this.subjectsService.findManyWithPagination({
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
    type: Subject,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findOne(@Param('id') id: string): Promise<NullableType<Subject>> {
    return this.subjectsService.findById(+id);
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
    type: Subject,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  update(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ): Promise<Subject | null> {
    return this.subjectsService.update(+id, updateSubjectDto);
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
    return this.subjectsService.remove(+id);
  }

  @Post('bulk-create')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiOperation({
    summary: 'Bulk create subjects from JSON data',
    description: 'Send an array of subject objects to bulk create subjects',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk creation processed successfully',
    type: BulkSubjectsResultDto,
  })
  async bulkCreate(
    @Body() bulkCreateDto: BulkCreateSubjectsDto,
  ): Promise<BulkSubjectsResultDto> {
    return this.subjectsService.bulkCreateFromData(bulkCreateDto.subjects);
  }
}
