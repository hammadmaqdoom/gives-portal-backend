import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { PaymentGateway } from './domain/payment-gateway';
import { PaymentGatewayCredentials } from './domain/payment-gateway-credentials';
import { PaymentsService } from './payments.service';
import { RequireSettingsAccess } from '../feature-modules/decorators/require-settings-access.decorator';
import { SettingsAccessGuard } from '../feature-modules/guards/settings-access.guard';

@ApiTags('Payment Gateways')
@Controller({
  path: 'payment-gateways',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard, SettingsAccessGuard)
@ApiBearerAuth()
export class PaymentGatewaysController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @RequireSettingsAccess('payment_gateways')
  @ApiOperation({ summary: 'Get all payment gateways' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment gateways retrieved successfully',
    type: [PaymentGateway],
  })
  async getAllGateways(): Promise<PaymentGateway[]> {
    return this.paymentsService.getAllGateways();
  }

  @Get('active')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin, RoleEnum.teacher, RoleEnum.user)
  @ApiOperation({ summary: 'Get active payment gateways for checkout' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active payment gateways retrieved successfully',
    type: [PaymentGateway],
  })
  async getActiveGateways(): Promise<PaymentGateway[]> {
    return this.paymentsService.getActiveGateways();
  }

  @Get(':id')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @RequireSettingsAccess('payment_gateways')
  @ApiOperation({ summary: 'Get payment gateway by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment gateway retrieved successfully',
    type: PaymentGateway,
  })
  async getGatewayById(@Param('id') id: string): Promise<PaymentGateway> {
    return this.paymentsService.getGatewayById(+id);
  }

  @Patch(':id/toggle')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @RequireSettingsAccess('payment_gateways')
  @ApiOperation({ summary: 'Toggle payment gateway active status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment gateway status updated successfully',
    type: PaymentGateway,
  })
  async toggleGatewayStatus(@Param('id') id: string): Promise<PaymentGateway> {
    return this.paymentsService.toggleGatewayStatus(+id);
  }

  @Patch(':id/set-default')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @RequireSettingsAccess('payment_gateways')
  @ApiOperation({ summary: 'Set payment gateway as default' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Default payment gateway updated successfully',
    type: PaymentGateway,
  })
  async setDefaultGateway(@Param('id') id: string): Promise<PaymentGateway> {
    return this.paymentsService.setDefaultGateway(+id);
  }

  @Get(':id/credentials')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @RequireSettingsAccess('payment_gateways')
  @ApiOperation({ summary: 'Get payment gateway credentials' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment gateway credentials retrieved successfully',
    type: [PaymentGatewayCredentials],
  })
  async getGatewayCredentials(
    @Param('id') id: string,
  ): Promise<PaymentGatewayCredentials[]> {
    return this.paymentsService.getGatewayCredentials(+id);
  }

  @Post(':id/credentials')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @RequireSettingsAccess('payment_gateways')
  @ApiOperation({ summary: 'Create or update payment gateway credentials' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment gateway credentials saved successfully',
    type: PaymentGatewayCredentials,
  })
  async saveGatewayCredentials(
    @Param('id') id: string,
    @Body() credentials: Partial<PaymentGatewayCredentials>,
  ): Promise<PaymentGatewayCredentials> {
    return this.paymentsService.saveGatewayCredentials(+id, credentials);
  }

  @Post(':id/test-connection')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @RequireSettingsAccess('payment_gateways')
  @ApiOperation({ summary: 'Test payment gateway connection' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connection test completed',
  })
  async testGatewayConnection(
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.paymentsService.testGatewayConnection(+id);
  }
}
