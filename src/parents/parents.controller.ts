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
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
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
import { QueryParentDto } from './dto/query-parent.dto';
import { Parent } from './domain/parent';
import { ParentsService } from './parents.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Parents')
@Controller({
  path: 'parents',
  version: '1',
})
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post('register')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Parent registered successfully (public endpoint)',
    type: Object,
  })
  @HttpCode(HttpStatus.CREATED)
  register(
    @Body() createParentDto: CreateParentDto,
  ): Promise<{ parent: Parent; user: any; tempPassword: string | null }> {
    return this.parentsService.create(createParentDto);
  }

  @ApiCreatedResponse({
    type: Object,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createParentDto: CreateParentDto,
  ): Promise<{ parent: Parent; user: any; tempPassword: string | null }> {
    return this.parentsService.create(createParentDto);
  }

  @ApiOkResponse({
    type: InfinityPaginationResponse(Parent),
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('relationship') relationship?: string,
    @Query() query?: QueryParentDto,
  ): Promise<InfinityPaginationResponseDto<Parent>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    // Merge top-level query parameters with filters object (prioritize top-level params)
    const filterOptions = {
      ...query?.filters,
      ...(search && { search }),
      ...(city && { city }),
      ...(country && { country }),
      ...(relationship && { relationship: relationship as 'father' | 'mother' | 'guardian' }),
    };

    return infinityPagination(
      await this.parentsService.findManyWithPagination({
        filterOptions,
        sortOptions: query?.sort,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @ApiOkResponse({
    type: Parent,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: Parent['id']): Promise<NullableType<Parent>> {
    return this.parentsService.findById(id);
  }

  @ApiOkResponse({
    type: Parent,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: Parent['id'],
    @Body() updateParentDto: UpdateParentDto,
  ): Promise<Parent | null> {
    return this.parentsService.update(id, updateParentDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: Parent['id']): Promise<void> {
    return this.parentsService.remove(id);
  }

  // New parent-student relationship endpoints
  @Post(':id/students/:studentId')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiParam({ name: 'studentId', type: String, required: true })
  @ApiCreatedResponse({
    description: 'Parent linked to student successfully',
  })
  linkStudent(
    @Param('id') parentId: string,
    @Param('studentId') studentId: string,
  ): Promise<any> {
    return this.parentsService.linkStudent(+parentId, +studentId);
  }

  @Delete(':id/students/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiParam({ name: 'studentId', type: String, required: true })
  unlinkStudent(
    @Param('id') parentId: string,
    @Param('studentId') studentId: string,
  ): Promise<void> {
    return this.parentsService.unlinkStudent(+parentId, +studentId);
  }

  @Get(':id/students')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiOkResponse({
    description: 'Parent students retrieved successfully',
  })
  getStudents(@Param('id') parentId: string): Promise<any[]> {
    return this.parentsService.getStudents(+parentId);
  }
}
