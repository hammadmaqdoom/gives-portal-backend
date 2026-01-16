import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CurrencyInterceptor } from '../currency/currency.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Cart')
@Controller({
  path: 'cart',
  version: '1',
})
@UseInterceptors(CurrencyInterceptor)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOkResponse({ description: 'Get current cart' })
  async getCart(@Req() req: any) {
    const userId = req.user?.id ? Number(req.user.id) : undefined;
    const sessionId = this.getOrCreateSessionId(req);
    const currency = req.currency || 'USD';

    const cart = await this.cartService.getCart(userId, sessionId, currency);

    // Always set the session ID cookie to ensure it persists
    if (req.res && sessionId) {
      req.res.cookie('cartSessionId', sessionId, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return { data: cart };
  }

  @Post('add')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add course to cart' })
  async addToCart(@Body() body: { classId: number }, @Req() req: any) {
    const userId = req.user?.id ? Number(req.user.id) : undefined;
    const sessionId = this.getOrCreateSessionId(req);
    const currency = req.currency || 'USD';

    const cart = await this.cartService.addToCart(
      body.classId,
      userId,
      sessionId,
      currency,
    );

    // Always set the session ID cookie to ensure it persists
    if (req.res && sessionId) {
      req.res.cookie('cartSessionId', sessionId, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return { data: cart };
  }

  @Delete('remove/:classId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Remove course from cart' })
  async removeFromCart(@Param('classId') classId: string, @Req() req: any) {
    const userId = req.user?.id ? Number(req.user.id) : undefined;
    const sessionId = this.getOrCreateSessionId(req);

    const cart = await this.cartService.removeFromCart(
      Number(classId),
      userId,
      sessionId,
    );
    return { data: cart };
  }

  @Post('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Clear cart' })
  async clearCart(@Req() req: any) {
    const userId = req.user?.id ? Number(req.user.id) : undefined;
    const sessionId = this.getOrCreateSessionId(req);

    await this.cartService.clearCart(userId, sessionId);
    return { message: 'Cart cleared successfully' };
  }

  /**
   * Get or create session ID for unauthenticated users
   */
  private getOrCreateSessionId(req: any): string {
    // Check if session ID exists in cookies, headers, or request body
    let sessionId =
      req.cookies?.cartSessionId || req.headers['x-cart-session-id'];

    if (!sessionId) {
      // Generate new session ID
      sessionId = uuidv4();
    }

    return sessionId;
  }
}
