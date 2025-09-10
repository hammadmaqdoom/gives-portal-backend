import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AnnouncementsService, CreateAnnouncementDto } from './announcements.service';

@ApiTags('Announcements')
@Controller({
  path: 'announcements',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.teacher)
  @ApiOperation({ summary: 'Create and send announcement' })
  @ApiResponse({ status: 200, description: 'Announcement sent successfully' })
  async createAnnouncement(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @Request() req: any,
  ) {
    // Set author ID from the authenticated user
    createAnnouncementDto.authorId = req.user.id;
    
    await this.announcementsService.createAnnouncement(createAnnouncementDto);
    
    return {
      message: 'Announcement sent successfully',
      targetAudience: createAnnouncementDto.targetAudience,
    };
  }
}