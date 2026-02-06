import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';

@Injectable()
export class FrontendOriginGuard implements CanActivate {
  constructor(
    private configService: ConfigService<AllConfigType>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Get allowed frontend domain from config
    const frontendDomain = this.configService.get('app.frontendDomain', {
      infer: true,
    });
    
    // In development, allow localhost and be more lenient
    const isDevelopment = this.configService.get('app.nodeEnv', {
      infer: true,
    }) === 'development';
    
    // If no frontend domain is configured, allow in development only
    if (!frontendDomain && !isDevelopment) {
      throw new ForbiddenException(
        'Frontend domain not configured. Direct access to files is not allowed.',
      );
    }
    
    // Get Origin and Referer headers
    const origin = request.headers.origin;
    const referer = request.headers.referer || request.headers.referrer;
    
    // Check for custom header that indicates request is from frontend
    const xFrontendRequest = request.headers['x-frontend-request'];
    
    // In development, allow requests without origin/referer (for testing)
    if (isDevelopment && (!origin && !referer)) {
      // But still require the custom header if available
      if (xFrontendRequest === 'true') {
        return true;
      }
      // Allow in development for easier testing, but log a warning
      console.warn('⚠️  File access without Origin/Referer in development mode');
      return true;
    }
    
    // Validate Origin header
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const originHost = originUrl.hostname;
        
        // Check if origin matches frontend domain
        if (frontendDomain) {
          try {
            const frontendUrl = new URL(frontendDomain);
            const frontendHost = frontendUrl.hostname;
            
            // Allow if origin matches frontend domain
            if (originHost === frontendHost) {
              return true;
            }
            
            // Also allow localhost in development
            if (isDevelopment && (originHost === 'localhost' || originHost === '127.0.0.1')) {
              return true;
            }
          } catch (e) {
            // If frontendDomain is not a valid URL, compare as string
            if (origin.includes(frontendDomain)) {
              return true;
            }
          }
        }
      } catch (e) {
        // Invalid origin URL, continue to check referer
      }
    }
    
    // Validate Referer header
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererHost = refererUrl.hostname;
        
        // Check if referer matches frontend domain
        if (frontendDomain) {
          try {
            const frontendUrl = new URL(frontendDomain);
            const frontendHost = frontendUrl.hostname;
            
            // Allow if referer matches frontend domain
            if (refererHost === frontendHost) {
              return true;
            }
            
            // Also allow localhost in development
            if (isDevelopment && (refererHost === 'localhost' || refererHost === '127.0.0.1')) {
              return true;
            }
          } catch (e) {
            // If frontendDomain is not a valid URL, compare as string
            if (referer.includes(frontendDomain)) {
              return true;
            }
          }
        }
      } catch (e) {
        // Invalid referer URL
      }
    }
    
    // If custom header is present, allow the request
    if (xFrontendRequest === 'true') {
      return true;
    }
    
    // If no valid origin/referer and no custom header, deny access
    throw new ForbiddenException(
      'Direct access to files is not allowed. Please access files through the application.',
    );
  }
}
