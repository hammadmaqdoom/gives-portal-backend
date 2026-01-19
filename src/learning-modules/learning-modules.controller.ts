import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LearningModulesService } from './learning-modules.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import sanitizeHtml from 'sanitize-html';
import { RolesGuard } from '../roles/roles.guard';

@ApiTags('Modules')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'modules', version: '1' })
export class LearningModulesController {
  constructor(private readonly service: LearningModulesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Array })
  async list(@Query('classId') classId?: number) {
    return this.service.list({
      classId: classId ? Number(classId) : undefined,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async get(@Param('id') id: string) {
    return this.service.get(Number(id));
  }

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: any) {
    const payload = { ...body };
    // Map legacy/temporary fields
    if (payload.description && !payload.contentHtml) {
      payload.contentHtml = sanitizeHtml(String(payload.description));
    }
    delete payload.description;
    // Normalize attachments (stringified JSON to array)
    if (typeof payload.attachments === 'string') {
      try {
        payload.attachments = JSON.parse(payload.attachments);
      } catch {
        payload.attachments = [];
      }
    }
    // Coerce date-like fields to null or Date
    const coerceDate = (v: any) => {
      if (v === undefined || v === null || v === '') return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };
    payload.zoomMeetingStartTime = coerceDate(payload.zoomMeetingStartTime);
    payload.dripReleaseDate = coerceDate(payload.dripReleaseDate);
    if (payload.contentHtml)
      payload.contentHtml = sanitizeHtml(payload.contentHtml);
    return this.service.create(payload);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() body: any) {
    const payload = { ...body };
    // Map legacy/temporary fields
    if (payload.description && !payload.contentHtml) {
      payload.contentHtml = sanitizeHtml(String(payload.description));
    }
    delete payload.description;
    // Normalize attachments (stringified JSON to array)
    if (typeof payload.attachments === 'string') {
      try {
        payload.attachments = JSON.parse(payload.attachments);
      } catch {
        payload.attachments = [];
      }
    }
    // Coerce date-like fields to null or Date
    const coerceDate = (v: any) => {
      if (v === undefined || v === null || v === '') return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };
    payload.zoomMeetingStartTime = coerceDate(payload.zoomMeetingStartTime);
    payload.dripReleaseDate = coerceDate(payload.dripReleaseDate);
    if (payload.contentHtml)
      payload.contentHtml = sanitizeHtml(payload.contentHtml);
    return this.service.update(Number(id), payload);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: any) {
    const userRole = req.user?.role?.name?.toLowerCase();
    
    // Admin and super admin can delete any module
    if (userRole === 'admin' || userRole === 'superadmin') {
      await this.service.remove(Number(id));
      return;
    }

    // Teacher authorization - check if they're assigned to the class
    if (userRole === 'teacher') {
      const authorized = await this.service.canTeacherModifyModule(
        req.user?.email,
        Number(id),
      );
      
      if (!authorized) {
        throw new BadRequestException(
          'You can only delete modules from classes you are assigned to teach',
        );
      }

      await this.service.remove(Number(id));
      return;
    }

    throw new BadRequestException('You are not authorized to delete this module');
  }

  @Post(':id/toggle-pinned')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @HttpCode(HttpStatus.OK)
  async togglePinned(@Param('id') id: string) {
    return this.service.togglePinned(Number(id));
  }

  @Post(':id/link-zoom-meeting')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @HttpCode(HttpStatus.OK)
  async linkZoomMeeting(
    @Param('id') id: string,
    @Body() body: { zoomMeetingId: number },
  ) {
    return this.service.linkZoomMeeting(Number(id), body.zoomMeetingId);
  }

  @Post(':id/unlink-zoom-meeting')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @HttpCode(HttpStatus.OK)
  async unlinkZoomMeeting(@Param('id') id: string) {
    return this.service.unlinkZoomMeeting(Number(id));
  }

  @Get('pinned')
  @HttpCode(HttpStatus.OK)
  async getPinnedModules(@Query('classId') classId?: number) {
    return this.service.getPinnedModules(classId ? Number(classId) : undefined);
  }

  // Student-facing convenience endpoints (to match frontend routes)
  @Get('student/:classId/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Array })
  async getModulesForStudentViaModules(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getModulesForStudent(
      Number(classId),
      Number(studentId),
    );
  }

  @Post(':moduleId/complete/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Object })
  async markModuleCompletedViaModules(
    @Param('moduleId') moduleId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.markModuleCompleted(
      Number(moduleId),
      Number(studentId),
    );
  }

  @Patch(':moduleId/progress/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Object })
  async updateModuleProgressViaModules(
    @Param('moduleId') moduleId: string,
    @Param('studentId') studentId: string,
    @Body() body: { progressPercentage: number; timeSpent?: number },
  ) {
    return this.service.updateModuleProgress(
      Number(moduleId),
      Number(studentId),
      body.progressPercentage,
      body.timeSpent,
    );
  }

  @Get('completed/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Array })
  async getCompletedModulesViaModules(@Param('studentId') studentId: string) {
    return this.service.getCompletedModules(Number(studentId));
  }
}

@ApiTags('Module Sections')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({ path: 'module-sections', version: '1' })
export class LearningModuleSectionsController {
  constructor(private readonly service: LearningModulesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async list(@Query('classId') classId: string) {
    return this.service.listSectionsByClass(Number(classId));
  }

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  async create(
    @Body() body: { classId: number; title: string; orderIndex?: number },
  ) {
    return this.service.createSection(
      body.classId,
      body.title,
      body.orderIndex ?? 0,
    );
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; orderIndex?: number },
  ) {
    return this.service.updateSection(Number(id), body);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.superAdmin)
  async remove(@Param('id') id: string, @Req() req: any) {
    const userRole = req.user?.role?.name?.toLowerCase();
    
    // Admin and super admin can delete any section
    if (userRole === 'admin' || userRole === 'superadmin') {
      await this.service.deleteSection(Number(id));
      return { success: true };
    }

    // Teacher authorization - check if they're assigned to the class
    if (userRole === 'teacher') {
      const authorized = await this.service.canTeacherModifySection(
        req.user?.email,
        Number(id),
      );
      
      if (!authorized) {
        throw new BadRequestException(
          'You can only delete sections from classes you are assigned to teach',
        );
      }

      await this.service.deleteSection(Number(id));
      return { success: true };
    }

    throw new BadRequestException('You are not authorized to delete this section');
  }

  @Post(':id/modules')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  async createModuleInSection(
    @Param('id') id: string,
    @Body() body: Partial<any>,
  ) {
    return this.service.createModuleInSection(Number(id), body);
  }

  @Patch('move/:moduleId/:sectionId')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  async moveModule(
    @Param('moduleId') moduleId: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.service.moveModuleToSection(
      Number(moduleId),
      Number(sectionId),
    );
  }

  // Drip Content Endpoints
  @Get('student/:classId/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Array })
  async getModulesForStudent(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getModulesForStudent(
      Number(classId),
      Number(studentId),
    );
  }

  // Module Completion Endpoints
  @Post(':moduleId/complete/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Object })
  async markModuleCompleted(
    @Param('moduleId') moduleId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.markModuleCompleted(
      Number(moduleId),
      Number(studentId),
    );
  }

  @Get(':moduleId/completion/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Object })
  async getModuleCompletion(
    @Param('moduleId') moduleId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.getModuleCompletion(
      Number(moduleId),
      Number(studentId),
    );
  }

  @Patch(':moduleId/progress/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Object })
  async updateModuleProgress(
    @Param('moduleId') moduleId: string,
    @Param('studentId') studentId: string,
    @Body() body: { progressPercentage: number; timeSpent?: number },
  ) {
    return this.service.updateModuleProgress(
      Number(moduleId),
      Number(studentId),
      body.progressPercentage,
      body.timeSpent,
    );
  }

  @Get('completed/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Array })
  async getCompletedModules(@Param('studentId') studentId: string) {
    return this.service.getCompletedModules(Number(studentId));
  }
}
