import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ClassEnrollmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id: number;
}

class ParentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: number;
}

class PhotoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;
}

class UserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: number;
}

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '123 Main St, City' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '2000-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PhotoDto)
  photo?: PhotoDto | null;

  @ApiPropertyOptional({ type: [ClassEnrollmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassEnrollmentDto)
  classes?: ClassEnrollmentDto[];

  @ApiPropertyOptional({ type: [ParentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParentDto)
  parents?: ParentDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDto)
  user?: UserDto | null;
}
