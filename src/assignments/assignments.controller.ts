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

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Assignments')
@Controller({
  path: 'assignments',
  version: '1',
})
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createAssignmentDto: CreateAssignmentDto,
    @Req() req: any,
  ): Promise<Assignment> {
    return this.assignmentsService.create(createAssignmentDto, req?.user);
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
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
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
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
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
  findOne(@Param('id') id: string): Promise<NullableType<Assignment>> {
    return this.assignmentsService.findById(+id);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
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
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.assignmentsService.remove(+id);
  }
}
