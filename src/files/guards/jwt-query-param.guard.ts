import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayloadType } from '../../auth/strategies/types/jwt-payload.type';
import { AllConfigType } from '../../config/config.type';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtQueryParamGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<AllConfigType>,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // First, try to get token from Authorization header (standard way)
    let token: string | null = null;
    
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no token in header, try to get from query parameter
    if (!token && request.query?.token) {
      token = request.query.token;
    }
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    
    try {
      // Verify the token
      const secret = this.configService.getOrThrow('auth.secret', { infer: true });
      const payload = this.jwtService.verify<JwtPayloadType>(token, { secret });
      
      if (!payload || !payload.id) {
        throw new UnauthorizedException('Invalid token payload');
      }
      
      // Get the full user object from the database
      const userId = typeof payload.id === 'string' ? parseInt(payload.id, 10) : payload.id;
      const user = await this.usersService.findById(userId);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      // Set the user in the request object
      request.user = user;
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
