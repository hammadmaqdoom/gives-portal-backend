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
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
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
import { QueryTeacherDto } from './dto/query-teacher.dto';
import { Teacher } from './domain/teacher';
import { TeachersService } from './teachers.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Teachers')
@Controller({
  path: 'teachers',
  version: '1',
})
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTeacherDto: CreateTeacherDto,
  ): Promise<{ teacher: Teacher; user: any; tempPassword: string | null }> {
    return this.teachersService.create(createTeacherDto);
  }

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

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.teachersService.remove(+id);
  }
}
