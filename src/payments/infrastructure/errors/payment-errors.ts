import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentGatewayNotFoundError extends HttpException {
  constructor(gatewayId: number) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Payment gateway not found',
        error: 'PaymentGatewayNotFound',
        details: { gatewayId },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class PaymentCredentialsNotFoundError extends HttpException {
  constructor(gatewayId: number) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Payment gateway credentials not found',
        error: 'PaymentCredentialsNotFound',
        details: { gatewayId },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class PaymentTransactionNotFoundError extends HttpException {
  constructor(transactionId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Payment transaction not found',
        error: 'PaymentTransactionNotFound',
        details: { transactionId },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class PaymentSessionCreationError extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to create payment session',
        error: 'PaymentSessionCreationError',
        details: { originalMessage: message, ...details },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class PaymentVerificationError extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Payment verification failed',
        error: 'PaymentVerificationError',
        details: { originalMessage: message, ...details },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class PaymentWebhookError extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Webhook processing failed',
        error: 'PaymentWebhookError',
        details: { originalMessage: message, ...details },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class PaymentEncryptionError extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Payment data encryption failed',
        error: 'PaymentEncryptionError',
        details: { originalMessage: message, ...details },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class PaymentAmountError extends HttpException {
  constructor(amount: number, minAmount?: number, maxAmount?: number) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid payment amount',
        error: 'PaymentAmountError',
        details: { amount, minAmount, maxAmount },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class PaymentCurrencyError extends HttpException {
  constructor(currency: string, supportedCurrencies: string[]) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Unsupported currency',
        error: 'PaymentCurrencyError',
        details: { currency, supportedCurrencies },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class PaymentGatewayConnectionError extends HttpException {
  constructor(gatewayName: string, message: string) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Payment gateway connection failed',
        error: 'PaymentGatewayConnectionError',
        details: { gatewayName, originalMessage: message },
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
