import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { OrNeverType } from '../../utils/types/or-never.type';
import { JwtPayloadType } from './types/jwt-payload.type';
import { AllConfigType } from '../../config/config.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<AllConfigType>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('auth.secret', { infer: true }),
    });
  }

  // Why we don't check if the user exists in the database:
  // https://github.com/brocoders/nestjs-boilerplate/blob/main/docs/auth.md#about-jwt-strategy
  public validate(payload: JwtPayloadType): OrNeverType<JwtPayloadType> {
    console.log('JWT Strategy - Payload received:', payload);
    console.log('JWT Strategy - Payload id type:', typeof payload.id);

    if (!payload.id) {
      console.log(
        'JWT Strategy - No id in payload, throwing UnauthorizedException',
      );
      throw new UnauthorizedException();
    }

    // Convert id to number if it's a string
    const processedPayload = {
      ...payload,
      id:
        typeof payload.id === 'string' ? parseInt(payload.id, 10) : payload.id,
    };

    return processedPayload;
  }
}
