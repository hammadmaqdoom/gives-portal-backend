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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BatchTermsService } from './batch-terms.service';
import { CreateBatchTermDto } from './dto/create-batch-term.dto';
import { UpdateBatchTermDto } from './dto/update-batch-term.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { BatchTerm } from './domain/batch-term';

@ApiTags('Batch Terms')
@Controller({
  path: 'batch-terms',
  version: '1',
})
export class BatchTermsController {
  constructor(private readonly batchTermsService: BatchTermsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Create a new batch term' })
  @ApiCreatedResponse({
    type: BatchTerm,
  })
  create(@Body() createBatchTermDto: CreateBatchTermDto): Promise<BatchTerm> {
    return this.batchTermsService.create(createBatchTermDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all batch terms' })
  @ApiQuery({
    name: 'activeOnly',
    required: false,
    type: Boolean,
    description: 'Return only active batch terms',
  })
  @ApiOkResponse({
    type: [BatchTerm],
  })
  findAll(@Query('activeOnly') activeOnly?: string): Promise<BatchTerm[]> {
    const activeOnlyBool = activeOnly === 'true';
    return this.batchTermsService.findAll(activeOnlyBool);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a batch term by ID' })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: BatchTerm,
  })
  findOne(@Param('id') id: string): Promise<BatchTerm | null> {
    return this.batchTermsService.findById(+id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Update a batch term' })
  @ApiParam({
    name: 'id',
    type: String,
  })
  @ApiOkResponse({
    type: BatchTerm,
  })
  update(
    @Param('id') id: string,
    @Body() updateBatchTermDto: UpdateBatchTermDto,
  ): Promise<BatchTerm> {
    return this.batchTermsService.update(+id, updateBatchTermDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a batch term' })
  @ApiParam({
    name: 'id',
    type: String,
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.batchTermsService.remove(+id);
  }
}
