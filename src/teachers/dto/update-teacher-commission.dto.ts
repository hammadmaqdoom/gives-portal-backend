import { PartialType } from '@nestjs/swagger';
import { CreateTeacherCommissionDto } from './create-teacher-commission.dto';

export class UpdateTeacherCommissionDto extends PartialType(
  CreateTeacherCommissionDto,
) {}
