import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { FileDto } from '../../files/dto/file.dto';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';

export class AuthUpdateDto {
  @ApiPropertyOptional({ type: () => FileDto })
  @IsOptional()
  photo?: FileDto | null;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'new.email@example.com' })
  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  @Transform(lowerCaseTransformer)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  oldPassword?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Software developer with 5 years of experience',
  })
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'United States' })
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  dateOfBirth?: string;
}
