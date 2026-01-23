import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AccessControlService } from './access-control.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Access Control')
@Controller({
  path: 'access-control',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AccessControlController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get('check/:studentId/:classId')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.teacher, RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Check course access for student' })
  async checkCourseAccess(
    @Param('studentId') studentId: string,
    @Param('classId') classId: string,
  ) {
    const status = await this.accessControlService.checkCourseAccess(
      Number(studentId),
      Number(classId),
    );
    return { data: status };
  }

  @Patch('toggle-admin-access/:studentId/:classId')
  @Roles(RoleEnum.admin, RoleEnum.superAdmin)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Toggle admin-granted access for student course',
  })
  async toggleAdminAccess(
    @Param('studentId') studentId: string,
    @Param('classId') classId: string,
    @Body() body: { enabled: boolean },
  ) {
    const result = await this.accessControlService.toggleAdminGrantedAccess(
      Number(studentId),
      Number(classId),
      body.enabled,
    );
    return { data: result };
  }
}
