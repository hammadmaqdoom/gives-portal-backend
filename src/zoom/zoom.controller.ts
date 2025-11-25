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
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ZoomController {
  constructor(private readonly zoomService: ZoomService) {}

  // OAuth (Authorization Code) endpoints
  @Get('oauth/authorize')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @ApiOperation({ summary: 'Redirect to Zoom OAuth (Authorization Code)' })
  async oauthAuthorize(@Request() req: any) {
    const url = await this.zoomService.getOAuthAuthorizeUrl(req.user.id);
    return { authorizeUrl: url };
  }

  @Get('oauth/callback')
  @ApiOperation({ summary: 'Zoom OAuth callback to exchange code for tokens' })
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    await this.zoomService.exchangeOAuthCode(code, state);
    return { ok: true };
  }

  // Zoom Credentials Management
  @Post('credentials')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
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
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @ApiOperation({ summary: 'Get teacher Zoom credentials' })
  @ApiResponse({
    status: 200,
    description: 'Credentials retrieved successfully',
  })
  async getCredentials(@Request() req: any) {
    const teacherId =
      req.user.role === RoleEnum.admin ? req.query.teacherId : req.user.id;
    return this.zoomService.getCredentials(teacherId);
  }

  @Put('credentials')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @ApiOperation({ summary: 'Update Zoom credentials' })
  @ApiResponse({ status: 200, description: 'Credentials updated successfully' })
  async updateCredentials(
    @Body() updateDto: UpdateZoomCredentialsDto,
    @Request() req: any,
  ) {
    const teacherId =
      req.user.role === RoleEnum.admin ? req.query.teacherId : req.user.id;
    return this.zoomService.updateCredentials(teacherId, updateDto);
  }

  @Delete('credentials')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete Zoom credentials' })
  @ApiResponse({ status: 204, description: 'Credentials deleted successfully' })
  async deleteCredentials(@Request() req: any) {
    const teacherId =
      req.user.role === RoleEnum.admin ? req.query.teacherId : req.user.id;
    await this.zoomService.deleteCredentials(teacherId);
  }

  @Post('credentials/test')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @ApiOperation({ summary: 'Test Zoom API connection' })
  @ApiResponse({ status: 200, description: 'Connection test completed' })
  async testConnection(@Request() req: any) {
    const teacherId =
      req.user.role === RoleEnum.admin ? req.query.teacherId : req.user.id;
    const isConnected = await this.zoomService.testZoomConnection(teacherId);
    return { isConnected };
  }

  // Zoom Meeting Management
  @Post('meetings')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
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
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get meetings for a specific class' })
  @ApiResponse({ status: 200, description: 'Meetings retrieved successfully' })
  async getMeetingsByClass(@Param('classId') classId: string) {
    return this.zoomService.getMeetingsByClass(parseInt(classId));
  }

  @Get('meetings/class/:classId/upcoming')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get upcoming meetings for a class' })
  @ApiResponse({
    status: 200,
    description: 'Upcoming meetings retrieved successfully',
  })
  async getUpcomingMeetingsByClass(@Param('classId') classId: string) {
    return this.zoomService.getUpcomingMeetingsByClass(parseInt(classId));
  }

  @Get('meetings/class/:classId/active')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get active meetings for a class' })
  @ApiResponse({
    status: 200,
    description: 'Active meetings retrieved successfully',
  })
  async getActiveMeetingsByClass(@Param('classId') classId: string) {
    return this.zoomService.getActiveMeetingsByClass(parseInt(classId));
  }

  @Get('meetings/:meetingId')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get meeting by meeting ID' })
  @ApiResponse({ status: 200, description: 'Meeting retrieved successfully' })
  async getMeetingByMeetingId(@Param('meetingId') meetingId: string) {
    return this.zoomService.getMeetingByMeetingId(meetingId);
  }

  @Get('meetings/id/:id')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get meeting by database ID' })
  @ApiResponse({ status: 200, description: 'Meeting retrieved successfully' })
  async getMeetingById(@Param('id') id: string) {
    return this.zoomService.getMeetingById(parseInt(id));
  }

  // Signature endpoint removed (no Web SDK embedding)

  @Put('meetings/:meetingId')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @ApiOperation({ summary: 'Update a Zoom meeting' })
  @ApiResponse({ status: 200, description: 'Meeting updated successfully' })
  async updateMeeting(
    @Param('meetingId') meetingId: string,
    @Body() updateDto: UpdateZoomMeetingDto,
  ) {
    return this.zoomService.updateMeeting(meetingId, updateDto);
  }

  @Post('meetings/:meetingId/start')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Start a Zoom meeting' })
  @ApiResponse({ status: 204, description: 'Meeting started successfully' })
  async startMeeting(@Param('meetingId') meetingId: string) {
    await this.zoomService.startMeeting(meetingId);
  }

  @Post('meetings/:meetingId/end')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'End a Zoom meeting' })
  @ApiResponse({ status: 204, description: 'Meeting ended successfully' })
  async endMeeting(@Param('meetingId') meetingId: string) {
    await this.zoomService.endMeeting(meetingId);
  }

  @Post('meetings/:meetingId/cancel')
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a Zoom meeting' })
  @ApiResponse({ status: 204, description: 'Meeting cancelled successfully' })
  async cancelMeeting(@Param('meetingId') meetingId: string) {
    await this.zoomService.cancelMeeting(meetingId);
  }

  @Post('meetings/:meetingId/join')
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
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
  @Roles(RoleEnum.teacher, RoleEnum.admin)
  @ApiOperation({ summary: 'Get meetings for a specific teacher' })
  @ApiResponse({
    status: 200,
    description: 'Teacher meetings retrieved successfully',
  })
  async getMeetingsByTeacher(@Request() req: any) {
    const teacherId =
      req.user.role === RoleEnum.admin ? req.query.teacherId : req.user.id;
    return this.zoomService.getMeetingsByTeacher(teacherId);
  }
}
