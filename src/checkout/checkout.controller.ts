import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CheckoutService, CreateCheckoutDto } from './checkout.service';
import { CurrencyInterceptor } from '../currency/currency.interceptor';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Checkout')
@Controller({
  path: 'checkout',
  version: '1',
})
@UseInterceptors(CurrencyInterceptor)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Create checkout session' })
  async createCheckout(@Body() dto: CreateCheckoutDto, @Req() req: any) {
    const userId = req.user?.id ? Number(req.user.id) : undefined;
    const sessionId = req.cookies?.cartSessionId || req.headers['x-cart-session-id'];
    const currency = req.currency || 'USD';

    const checkoutSession = await this.checkoutService.createCheckout(
      dto,
      userId,
      sessionId,
      currency,
    );

    return { data: checkoutSession };
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Complete checkout after payment' })
  async completeCheckout(
    @Body() body: { checkoutId: string; transactionId?: string },
    @Req() req: any,
  ) {
    const result = await this.checkoutService.completeCheckout(
      body.checkoutId,
      body.transactionId,
    );

    return { data: result };
  }
}

