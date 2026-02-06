import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { StudentModuleNoteService } from './student-module-note.service';
import { SaveStudentNoteDto } from './dto/save-student-note.dto';

@ApiTags('Student Module Notes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller({
  path: 'student-module-notes',
  version: '1',
})
export class StudentModuleNoteController {
  constructor(
    private readonly studentModuleNoteService: StudentModuleNoteService,
  ) {}

  @Post('save')
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Save or update a student note for a module' })
  @ApiResponse({
    status: 200,
    description: 'Note saved successfully',
  })
  async saveOrUpdate(@Body() dto: SaveStudentNoteDto) {
    return this.studentModuleNoteService.saveOrUpdate(dto);
  }

  @Get('student/:studentId')
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Get all notes for a student' })
  @ApiParam({ name: 'studentId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Student notes retrieved' })
  async getStudentNotes(@Param('studentId') studentId: string) {
    return this.studentModuleNoteService.getStudentNotes(parseInt(studentId));
  }

  @Get('module/:moduleId')
  @Roles(RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Get all notes for a specific module' })
  @ApiParam({ name: 'moduleId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Module notes retrieved' })
  async getModuleNotes(@Param('moduleId') moduleId: string) {
    return this.studentModuleNoteService.getModuleNotes(parseInt(moduleId));
  }

  @Get('student/:studentId/module/:moduleId')
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({
    summary: 'Get a specific note for a student and module',
  })
  @ApiParam({ name: 'studentId', type: 'number' })
  @ApiParam({ name: 'moduleId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Note retrieved' })
  async getNoteForStudentAndModule(
    @Param('studentId') studentId: string,
    @Param('moduleId') moduleId: string,
  ) {
    return this.studentModuleNoteService.getNoteForStudentAndModule(
      parseInt(studentId),
      parseInt(moduleId),
    );
  }

  @Delete('student/:studentId/module/:moduleId')
  @Roles(RoleEnum.user, RoleEnum.teacher, RoleEnum.admin, RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Delete a student note for a module' })
  @ApiParam({ name: 'studentId', type: 'number' })
  @ApiParam({ name: 'moduleId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  async deleteNote(
    @Param('studentId') studentId: string,
    @Param('moduleId') moduleId: string,
  ) {
    await this.studentModuleNoteService.deleteNote(
      parseInt(studentId),
      parseInt(moduleId),
    );
    return { message: 'Note deleted successfully' };
  }
}
