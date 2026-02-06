import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
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
import { ModuleCompletionService } from './module-completion.service';
import { MarkModuleCompleteDto } from './dto/mark-module-complete.dto';

@ApiTags('Module Completion')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'module-completion',
  version: '1',
})
export class ModuleCompletionController {
  constructor(
    private readonly moduleCompletionService: ModuleCompletionService,
  ) {}

  @Post('mark-complete')
  @Roles(RoleEnum.user) // Using user role for students
  @ApiOperation({ summary: 'Mark a module as complete or incomplete' })
  @ApiResponse({ status: 200, description: 'Module completion status updated' })
  async markAsComplete(@Body() dto: MarkModuleCompleteDto) {
    return this.moduleCompletionService.markAsComplete(dto);
  }

  @Get('student/:studentId')
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Get all module completions for a student' })
  @ApiResponse({ status: 200, description: 'Student module completions' })
  async getStudentCompletions(@Param('studentId') studentId: string) {
    return this.moduleCompletionService.getStudentCompletions(
      parseInt(studentId),
    );
  }

  @Get('module/:moduleId')
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Get all completions for a specific module' })
  @ApiResponse({ status: 200, description: 'Module completions' })
  async getModuleCompletions(@Param('moduleId') moduleId: string) {
    return this.moduleCompletionService.getModuleCompletions(
      parseInt(moduleId),
    );
  }

  @Get('check/:moduleId/:studentId')
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Check if a module is completed by a student' })
  @ApiResponse({ status: 200, description: 'Completion status' })
  async checkCompletion(
    @Param('moduleId') moduleId: string,
    @Param('studentId') studentId: string,
  ) {
    const isCompleted =
      await this.moduleCompletionService.isModuleCompletedByStudent(
        parseInt(moduleId),
        parseInt(studentId),
      );
    return { isCompleted };
  }
}
