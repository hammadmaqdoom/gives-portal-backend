import {
  Controller,
  Get,
  Param,
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
  @Roles(RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
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
}

