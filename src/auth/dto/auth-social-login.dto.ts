import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AuthProvidersEnum } from '../auth-providers.enum';

export class AuthSocialLoginDto {
  @ApiProperty({ enum: AuthProvidersEnum })
  @IsEnum(AuthProvidersEnum)
  @IsNotEmpty()
  provider: AuthProvidersEnum;
}
