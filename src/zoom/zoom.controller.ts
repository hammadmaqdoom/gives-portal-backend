import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { ZoomService } from './zoom.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import {
  CreateZoomCredentialsDto,
  UpdateZoomCredentialsDto,
} from './domain/zoom-credentials';
import {
  CreateZoomMeetingDto,
  UpdateZoomMeetingDto,
  JoinZoomMeetingDto,
} from './domain/zoom-meeting';

@ApiTags('Zoom')
@Controller({
  path: 'zoom',
  version: '1',
})
export class ZoomController {
  constructor(
    private readonly zoomService: ZoomService,
    private readonly configService: ConfigService,
  ) {}

  // OAuth (Authorization Code) endpoints
  @Get('oauth/authorize')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Redirect to Zoom OAuth (Authorization Code)' })
  async oauthAuthorize(@Request() req: any) {
    const url = await this.zoomService.getOAuthAuthorizeUrl(req.user.id);
    return { authorizeUrl: url };
  }

  // Public endpoint - no authentication required (Zoom redirects here)
  @Get('oauth/callback')
  @ApiOperation({ summary: 'Zoom OAuth callback to exchange code for tokens' })
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    // Get frontend URL for redirect
    const frontendUrl =
      this.configService.get('app.frontendDomain', { infer: true }) ||
      this.configService.get('APP_URL', { infer: true }) ||
      this.configService.get('FRONTEND_DOMAIN', { infer: true }) ||
      'http://localhost:3000';

    try {
      // If Zoom returned an error, redirect with error message
      if (error) {
        return res.redirect(
          `${frontendUrl}/dashboard/zoom/callback?error=${encodeURIComponent(error)}`,
        );
      }

      // If no code, redirect with error
      if (!code) {
        return res.redirect(
          `${frontendUrl}/dashboard/zoom/callback?error=${encodeURIComponent('No authorization code received')}`,
        );
      }

      // Exchange code for tokens
      await this.zoomService.exchangeOAuthCode(code, state);

      // Redirect to frontend success page
      return res.redirect(
        `${frontendUrl}/dashboard/zoom/callback?success=true`,
      );
    } catch (error: any) {
      // Redirect to frontend with error message
      const errorMessage =
        error?.message || 'Failed to connect Zoom account';
      return res.redirect(
        `${frontendUrl}/dashboard/zoom/callback?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  // Zoom Credentials Management
  @Post('credentials')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Create Zoom credentials for teacher' })
  @ApiResponse({ status: 201, description: 'Credentials created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createCredentials(
    @Body() createDto: CreateZoomCredentialsDto,
    @Request() req: any,
  ) {
    // Ensure teacher can only create their own credentials
    if (req.user.role === RoleEnum.teacher) {
      createDto.teacherId = req.user.id;
    }

    return this.zoomService.createCredentials(createDto);
  }

  @Get('credentials')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Get teacher Zoom credentials' })
  @ApiResponse({
    status: 200,
    description: 'Credentials retrieved successfully',
  })
  async getCredentials(@Request() req: any) {
    const teacherId =
      req.user.role === RoleEnum.admin || req.user.role === RoleEnum.superAdmin ? req.query.teacherId : req.user.id;
    return this.zoomService.getCredentials(teacherId);
  }

  @Put('credentials')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Update Zoom credentials' })
  @ApiResponse({ status: 200, description: 'Credentials updated successfully' })
  async updateCredentials(
    @Body() updateDto: UpdateZoomCredentialsDto,
    @Request() req: any,
  ) {
    const teacherId =
      req.user.role === RoleEnum.admin || req.user.role === RoleEnum.superAdmin ? req.query.teacherId : req.user.id;
    return this.zoomService.updateCredentials(teacherId, updateDto);
  }

  @Delete('credentials')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete Zoom credentials' })
  @ApiResponse({ status: 204, description: 'Credentials deleted successfully' })
  async deleteCredentials(@Request() req: any) {
    const teacherId =
      req.user.role === RoleEnum.admin || req.user.role === RoleEnum.superAdmin ? req.query.teacherId : req.user.id;
    await this.zoomService.deleteCredentials(teacherId);
  }

  @Post('credentials/test')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Test Zoom API connection' })
  @ApiResponse({ status: 200, description: 'Connection test completed' })
  async testConnection(@Request() req: any) {
    const teacherId =
      req.user.role === RoleEnum.admin || req.user.role === RoleEnum.superAdmin ? req.query.teacherId : req.user.id;
    const isConnected = await this.zoomService.testZoomConnection(teacherId);
    return { isConnected };
  }

  // Zoom Meeting Management
  @Post('meetings')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Create a new Zoom meeting' })
  @ApiResponse({ status: 201, description: 'Meeting created successfully' })
  async createMeeting(
    @Body() createDto: CreateZoomMeetingDto,
    @Request() req: any,
  ) {
    // Ensure teacher can only create meetings for their classes
    if (req.user.role === RoleEnum.teacher) {
      createDto.teacherId = req.user.id;
    }

    return this.zoomService.createMeeting(createDto);
  }

  @Get('meetings/class/:classId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get meetings for a specific class' })
  @ApiResponse({ status: 200, description: 'Meetings retrieved successfully' })
  async getMeetingsByClass(@Param('classId') classId: string) {
    return this.zoomService.getMeetingsByClass(parseInt(classId));
  }

  @Get('meetings/class/:classId/upcoming')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get upcoming meetings for a class' })
  @ApiResponse({
    status: 200,
    description: 'Upcoming meetings retrieved successfully',
  })
  async getUpcomingMeetingsByClass(@Param('classId') classId: string) {
    return this.zoomService.getUpcomingMeetingsByClass(parseInt(classId));
  }

  @Get('meetings/class/:classId/active')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get active meetings for a class' })
  @ApiResponse({
    status: 200,
    description: 'Active meetings retrieved successfully',
  })
  async getActiveMeetingsByClass(@Param('classId') classId: string) {
    return this.zoomService.getActiveMeetingsByClass(parseInt(classId));
  }

  @Get('meetings/:meetingId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get meeting by meeting ID' })
  @ApiResponse({ status: 200, description: 'Meeting retrieved successfully' })
  async getMeetingByMeetingId(@Param('meetingId') meetingId: string) {
    return this.zoomService.getMeetingByMeetingId(meetingId);
  }

  @Get('meetings/id/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get meeting by database ID' })
  @ApiResponse({ status: 200, description: 'Meeting retrieved successfully' })
  async getMeetingById(@Param('id') id: string) {
    return this.zoomService.getMeetingById(parseInt(id));
  }

  // Signature endpoint removed (no Web SDK embedding)

  @Put('meetings/:meetingId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Update a Zoom meeting' })
  @ApiResponse({ status: 200, description: 'Meeting updated successfully' })
  async updateMeeting(
    @Param('meetingId') meetingId: string,
    @Body() updateDto: UpdateZoomMeetingDto,
  ) {
    return this.zoomService.updateMeeting(meetingId, updateDto);
  }

  @Post('meetings/:meetingId/start')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Start a Zoom meeting' })
  @ApiResponse({ status: 204, description: 'Meeting started successfully' })
  async startMeeting(@Param('meetingId') meetingId: string) {
    await this.zoomService.startMeeting(meetingId);
  }

  @Post('meetings/:meetingId/end')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'End a Zoom meeting' })
  @ApiResponse({ status: 204, description: 'Meeting ended successfully' })
  async endMeeting(@Param('meetingId') meetingId: string) {
    await this.zoomService.endMeeting(meetingId);
  }

  @Post('meetings/:meetingId/cancel')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a Zoom meeting' })
  @ApiResponse({ status: 204, description: 'Meeting cancelled successfully' })
  async cancelMeeting(@Param('meetingId') meetingId: string) {
    await this.zoomService.cancelMeeting(meetingId);
  }

  @Post('meetings/:meetingId/join')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Join a Zoom meeting' })
  @ApiResponse({ status: 200, description: 'Meeting join details retrieved' })
  async joinMeeting(
    @Param('meetingId') meetingId: string,
    @Body() joinDto: JoinZoomMeetingDto,
  ) {
    return this.zoomService.joinMeeting(joinDto);
  }

  // Teacher-specific endpoints
  @Get('meetings/teacher')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Get meetings for a specific teacher' })
  @ApiResponse({
    status: 200,
    description: 'Teacher meetings retrieved successfully',
  })
  async getMeetingsByTeacher(@Request() req: any) {
    const teacherId =
      req.user.role === RoleEnum.admin || req.user.role === RoleEnum.superAdmin ? req.query.teacherId : req.user.id;
    return this.zoomService.getMeetingsByTeacher(teacherId);
  }

  // Admin statistics endpoint
  @Get('statistics/teachers')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Get Zoom connection statistics for all teachers' })
  @ApiResponse({
    status: 200,
    description: 'Teacher Zoom statistics retrieved successfully',
  })
  async getTeacherStatistics() {
    return this.zoomService.getTeacherZoomStatistics();
  }
}
