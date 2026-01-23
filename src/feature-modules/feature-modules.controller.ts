import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { FeatureModulesService } from './feature-modules.service';
import { FeatureModule } from './domain/feature-module';
import { UpdateFeatureModuleDto } from './dto/update-feature-module.dto';

@ApiTags('Feature Modules')
@Controller({
  path: 'feature-modules',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class FeatureModulesController {
  constructor(
    private readonly featureModulesService: FeatureModulesService,
  ) {}

  @Get()
  @Roles(RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Get all feature modules' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feature modules retrieved successfully',
    type: [FeatureModule],
  })
  async findAll(): Promise<FeatureModule[]> {
    return this.featureModulesService.findAll();
  }

  @Get('type/:type')
  @Roles(RoleEnum.superAdmin, RoleEnum.admin)
  @ApiOperation({ summary: 'Get feature modules by type' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feature modules retrieved successfully',
    type: [FeatureModule],
  })
  async findByType(
    @Param('type') type: 'feature' | 'settings_tab',
  ): Promise<FeatureModule[]> {
    return this.featureModulesService.findByType(type);
  }

  @Get(':id')
  @Roles(RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Get feature module by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feature module retrieved successfully',
    type: FeatureModule,
  })
  async findById(@Param('id') id: string): Promise<FeatureModule> {
    return this.featureModulesService.findById(+id);
  }

  @Patch(':id')
  @Roles(RoleEnum.superAdmin)
  @ApiOperation({ summary: 'Update feature module' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feature module updated successfully',
    type: FeatureModule,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFeatureModuleDto,
  ): Promise<FeatureModule> {
    return this.featureModulesService.update(+id, updateDto);
  }
}
