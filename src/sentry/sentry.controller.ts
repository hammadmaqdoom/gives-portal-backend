import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Sentry')
@Controller({
  path: 'sentry',
  version: '1',
})
export class SentryController {
  @Get('debug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test Sentry error tracking' })
  @ApiResponse({
    status: 200,
    description: 'Error thrown successfully for Sentry testing',
  })
  getError() {
    throw new Error('My first Sentry error!');
  }
}
