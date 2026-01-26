import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from '../../roles/roles.enum';
import { FeatureModulesService } from '../feature-modules.service';
import { SETTINGS_ACCESS_KEY } from '../decorators/require-settings-access.decorator';

@Injectable()
export class SettingsAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureModulesService: FeatureModulesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<string>(
      SETTINGS_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no settings access requirement, allow through
    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super admins always have access
    if (user?.role?.id === RoleEnum.superAdmin) {
      return true;
    }

    // For regular admins, check if the module is enabled
    const isEnabled = await this.featureModulesService.isModuleEnabled(
      requiredModule,
    );

    if (!isEnabled) {
      throw new ForbiddenException(
        `Access to ${requiredModule} settings is not enabled for your account`,
      );
    }

    return true;
  }
}
