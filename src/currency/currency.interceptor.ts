import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CurrencyService } from './currency.service';

@Injectable()
export class CurrencyInterceptor implements NestInterceptor {
  constructor(private readonly currencyService: CurrencyService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // Extract IP and detect currency
    const ip = this.currencyService.extractClientIp(request);
    const currency = await this.currencyService.detectCurrencyFromIp(ip);
    
    // Attach currency to request object
    request.currency = currency;
    request.clientIp = ip;

    return next.handle();
  }
}

