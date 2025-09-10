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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LearningModulesService } from './learning-modules.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import sanitizeHtml from 'sanitize-html';

@ApiTags('Modules')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
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
    if (payload.contentHtml)
      payload.contentHtml = sanitizeHtml(payload.contentHtml);
    return this.service.create(payload);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() body: any) {
    const payload = { ...body };
    if (payload.contentHtml)
      payload.contentHtml = sanitizeHtml(payload.contentHtml);
    return this.service.update(Number(id), payload);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.service.remove(Number(id));
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
}
