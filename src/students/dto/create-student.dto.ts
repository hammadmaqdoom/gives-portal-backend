import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'isValidDate', async: false })
export class IsValidDateConstraint implements ValidatorConstraintInterface {
  validate(dateString: string, args: ValidationArguments) {
    if (!dateString) return true; // Optional field
    const date = new Date(dateString);
    return (
      date instanceof Date &&
      !isNaN(date.getTime()) &&
      date.getFullYear() >= 1900 &&
      date.getFullYear() <= 2100
    );
  }

  defaultMessage(args: ValidationArguments) {
    return 'dateOfBirth must be a valid date between 1900 and 2100';
  }
}

class ClassEnrollmentDto {
  @ApiProperty()
  @IsNotEmpty()
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

export class CreateStudentDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

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
  @Validate(IsValidDateConstraint)
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
