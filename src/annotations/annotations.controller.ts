import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AnnotationsService } from './annotations.service';
import { CreateAnnotationDocumentDto } from './dto/create-annotation-document.dto';
import { UpdateAnnotationDocumentDto } from './dto/update-annotation-document.dto';

@ApiTags('annotations')
@Controller({
  path: 'annotations',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AnnotationsController {
  constructor(private readonly annotationsService: AnnotationsService) {}

  @Post()
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @ApiOperation({ summary: 'Create annotation document' })
  @ApiResponse({ status: 201, description: 'Annotation document created successfully' })
  create(@Body() createAnnotationDocumentDto: CreateAnnotationDocumentDto) {
    return this.annotationsService.create(createAnnotationDocumentDto);
  }

  @Get(':id')
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.user)
  @ApiOperation({ summary: 'Get annotation document by ID' })
  @ApiResponse({ status: 200, description: 'Annotation document retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.annotationsService.findById(id);
  }

  @Get('submission/:submissionId')
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.user)
  @ApiOperation({ summary: 'Get annotation document by submission ID' })
  @ApiResponse({ status: 200, description: 'Annotation document retrieved successfully' })
  findBySubmissionId(@Param('submissionId') submissionId: string) {
    return this.annotationsService.findBySubmissionId(submissionId);
  }

  @Get('file/:fileId')
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.user)
  @ApiOperation({ summary: 'Get annotation document by file ID' })
  @ApiResponse({ status: 200, description: 'Annotation document retrieved successfully' })
  findByFileId(@Param('fileId') fileId: string) {
    return this.annotationsService.findByFileId(fileId);
  }

  @Patch(':id')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @ApiOperation({ summary: 'Update annotation document' })
  @ApiResponse({ status: 200, description: 'Annotation document updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateAnnotationDocumentDto: UpdateAnnotationDocumentDto,
  ) {
    return this.annotationsService.update(id, updateAnnotationDocumentDto);
  }

  @Post('save')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @ApiOperation({ summary: 'Save or update annotation document' })
  @ApiResponse({ status: 200, description: 'Annotation document saved successfully' })
  saveOrUpdate(
    @Body() body: { submissionId: string; fileId: string; layers: any[] },
  ) {
    return this.annotationsService.saveOrUpdate(
      body.submissionId,
      body.fileId,
      body.layers,
    );
  }

  @Delete(':id')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @ApiOperation({ summary: 'Delete annotation document' })
  @ApiResponse({ status: 200, description: 'Annotation document deleted successfully' })
  remove(@Param('id') id: string) {
    return this.annotationsService.delete(id);
  }
}
