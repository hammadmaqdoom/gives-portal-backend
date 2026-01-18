import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateFeatureModuleDto {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
