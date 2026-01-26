import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { OrNeverType } from '../../utils/types/or-never.type';
import { JwtPayloadType } from '../../auth/strategies/types/jwt-payload.type';
import { AllConfigType } from '../../config/config.type';
import { Request } from 'express';

/**
 * Custom JWT extractor that checks both Authorization header and query parameter
 */
const extractJwtFromHeaderOrQuery = (request: Request): string | null => {
  // First, try to get token from Authorization header
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // If no token in header, try to get from query parameter
  if (request.query?.token) {
    const rawToken = request.query.token as string;
    // Check if the token appears to be URL-encoded (contains %)
    if (rawToken.includes('%')) {
      try {
        return decodeURIComponent(rawToken);
      } catch (e) {
        // If decoding fails, use the token as-is
        return rawToken;
      }
    }
    return rawToken;
  }

  return null;
};

@Injectable()
export class JwtQueryParamStrategy extends PassportStrategy(Strategy, 'jwt-query-param') {
  constructor(configService: ConfigService<AllConfigType>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractJwtFromHeaderOrQuery]),
      secretOrKey: configService.getOrThrow('auth.secret', { infer: true }),
      passReqToCallback: false,
    });
  }

  public validate(payload: JwtPayloadType): OrNeverType<JwtPayloadType> {
    if (!payload.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Convert id to number if it's a string
    const processedPayload = {
      ...payload,
      id: typeof payload.id === 'string' ? parseInt(payload.id, 10) : payload.id,
    };

    return processedPayload;
  }
}
