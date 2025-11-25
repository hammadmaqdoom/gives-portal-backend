import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: number;
}

export class UpdateParentDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  landline?: string;

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

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'father' })
  @IsOptional()
  @IsString()
  relationship?: 'father' | 'mother' | 'guardian';

  @ApiPropertyOptional({ example: 'married' })
  @IsOptional()
  @IsString()
  maritalStatus?: 'married' | 'divorced' | 'deceased' | 'single';

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  passcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDto)
  user?: UserDto | null;
}
