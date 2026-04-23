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
  Request,
  Logger,
} from '@nestjs/common';
import { CreateFeeDto } from './dto/create-fee.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';
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
import { QueryFeeDto } from './dto/query-fee.dto';
import { Fee } from './domain/fee';
import { FeesService } from './fees.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';
import { DiscountAnalyticsDto } from './dto/discount-analytics.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Fees')
@Controller({
  path: 'fees',
  version: '1',
})
export class FeesController {
  private readonly logger = new Logger(FeesController.name);

  constructor(private readonly feesService: FeesService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createFeeDto: CreateFeeDto): Promise<Fee> {
    return this.feesService.create(createFeeDto);
  }

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher)
  @ApiOkResponse({
    type: InfinityPaginationResponseDto,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async findAll(
    @Query() query: QueryFeeDto,
  ): Promise<InfinityPaginationResponseDto<Fee>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    const data = await this.feesService.findManyWithPagination({
      filterOptions: query?.filters ?? null,
      sortOptions: query?.sort ?? null,
      paginationOptions: {
        page,
        limit,
      },
    });

    return infinityPagination(data, { page, limit });
  }

  @Get('student/:studentId')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher, RoleEnum.user)
  @ApiParam({
    name: 'studentId',
    type: String,
  })
  @ApiOkResponse({
    type: [Fee],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByStudent(@Param('studentId') studentId: string): Promise<Fee[]> {
    return this.feesService.findByStudent(+studentId);
  }

  @Get('class/:classId')
  @ApiParam({
    name: 'classId',
    type: String,
  })
  @ApiOkResponse({
    type: [Fee],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByClass(@Param('classId') classId: string): Promise<Fee[]> {
    return this.feesService.findByClass(+classId);
  }

  @Get('student/:studentId/class/:classId')
  @ApiParam({
    name: 'studentId',
    type: String,
  })
  @ApiParam({
    name: 'classId',
    type: String,
  })
  @ApiOkResponse({
    type: [Fee],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findByStudentAndClass(
    @Param('studentId') studentId: string,
    @Param('classId') classId: string,
  ): Promise<Fee[]> {
    return this.feesService.findByStudentAndClass(+studentId, +classId);
  }

  @Get('overdue')
  @ApiOkResponse({
    type: [Fee],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findOverdueFees(): Promise<Fee[]> {
    return this.feesService.findOverdueFees();
  }

  // Endpoint for users to get their own fees (parent or student)
  @Get('my-fees')
  @Roles(RoleEnum.user)
  @ApiOkResponse({
    type: [Fee],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  async getMyFees(@Request() req): Promise<Fee[]> {
    const userId = req.user?.id;
    this.logger.debug(`getMyFees userId=${userId}`);

    if (!userId || isNaN(userId)) {
      return [];
    }

    if (await this.feesService.isUserParent(userId)) {
      return this.feesService.getFeesForParent(userId);
    }

    if (await this.feesService.isUserStudent(userId)) {
      return this.feesService.getFeesForStudent(userId);
    }

    return [];
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Fee,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  findOne(@Param('id') id: string): Promise<NullableType<Fee>> {
    if (!id || isNaN(+id)) {
      return Promise.resolve(null);
    }

    return this.feesService.findById(+id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Fee,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  update(
    @Param('id') id: string,
    @Body() updateFeeDto: UpdateFeeDto,
  ): Promise<Fee | null> {
    return this.feesService.update(+id, updateFeeDto);
  }

  @Patch(':id/mark-paid')
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: Fee,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  markAsPaid(
    @Param('id') id: string,
    @Body() body: { paymentMethod: string; transactionId?: string },
  ): Promise<Fee | null> {
    return this.feesService.markAsPaid(
      +id,
      body.paymentMethod,
      body.transactionId,
    );
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @ApiParam({
    name: 'id',
    type: String,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.feesService.remove(+id);
  }

  // Additional endpoints for frontend compatibility
  @Get('student/:studentId/payments')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher, RoleEnum.user)
  @ApiParam({
    name: 'studentId',
    type: String,
  })
  @ApiOkResponse({
    type: [Fee],
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  getStudentPayments(@Param('studentId') studentId: string): Promise<Fee[]> {
    return this.feesService.findByStudent(+studentId);
  }

  @Get('reports')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher)
  @ApiOkResponse({
    type: DiscountAnalyticsDto,
  })
  async getFinancialReports(
    @Query() query: any,
  ): Promise<DiscountAnalyticsDto> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    const discountType = query.discountType || undefined;

    return this.feesService.getFinancialReports(
      startDate,
      endDate,
      discountType,
    );
  }
}
