import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsBoolean } from 'class-validator';

export class MarkModuleCompleteDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  studentId: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  moduleId: number;

  @ApiProperty({ example: true })
  @IsNotEmpty()
  @IsBoolean()
  isCompleted: boolean;
}
