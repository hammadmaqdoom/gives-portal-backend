import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClassesService } from '../classes/classes.service';
import { InvoicesService } from '../invoices/invoices.service';
import { SettingsService } from '../settings/settings.service';
import { UploadProofDto } from './dto/upload-proof.dto';
import { CurrencyInterceptor } from '../currency/currency.interceptor';
import { LearningModulesService } from '../learning-modules/learning-modules.service';

@ApiTags('Public')
@Controller({
  path: 'public',
  version: '1',
})
@UseInterceptors(CurrencyInterceptor)
export class PublicController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly invoicesService: InvoicesService,
    private readonly settingsService: SettingsService,
    private readonly learningModulesService: LearningModulesService,
  ) {}

  @Get('classes')
  @ApiOkResponse({ description: 'Public classes list' })
  async getPublicClasses(@Query() query: any, @Req() req: any) {
    const page = Number(query?.page ?? 1);
    const limit = Number(query?.limit ?? 12);
    const currency = req.currency || 'USD';
    
    // Parse filters if provided as JSON string
    let filterOptions = null;
    if (query?.filters) {
      try {
        filterOptions = typeof query.filters === 'string' 
          ? JSON.parse(query.filters) 
          : query.filters;
      } catch {
        filterOptions = null;
      }
    }

    const data = await this.classesService.findPublicClassesForSale(
      currency,
      filterOptions,
      { page, limit },
    );
    
    return { 
      data, 
      meta: { 
        page, 
        limit, 
        total: data.length,
        currency,
      } 
    };
  }

  @Get('classes/:id')
  @ApiOkResponse({ description: 'Public class detail' })
  async getPublicClass(@Param('id') id: string, @Req() req: any) {
    const currency = req.currency || 'USD';
    const data = await this.classesService.findById(+id);
    
    if (!data) {
      return { data: null };
    }

    // Check if class is available for public sale
    if (!(data as any).isPublicForSale) {
      return { data: null, error: 'Course not available for public sale' };
    }

    // Add currency-aware price
    const price = this.classesService.getPriceForCurrency(data, currency);
    
    return { 
      data: {
        ...data,
        price,
        currency,
      }
    };
  }

  @Get('classes/:id/modules')
  @ApiOkResponse({ description: 'Get all modules for a public class' })
  async getPublicClassModules(@Param('id') id: string) {
    const classEntity = await this.classesService.findById(+id);
    
    if (!classEntity || !(classEntity as any).isPublicForSale) {
      return { data: [], error: 'Course not available' };
    }

    const modules = await this.learningModulesService.list({ classId: +id });
    
    // Return modules with preview flag, but only show previewable content
    return {
      data: modules.map((module: any) => ({
        id: module.id,
        title: module.title,
        orderIndex: module.orderIndex,
        isPreviewable: module.isPreviewable || false,
        // Only include content if previewable
        contentHtml: module.isPreviewable ? module.contentHtml : null,
        videoUrl: module.isPreviewable ? module.videoUrl : null,
        attachments: module.isPreviewable ? module.attachments : null,
        // Always show type indicators
        moduleType: module.videoUrl ? 'video' : module.attachments?.length ? 'document' : 'text',
      })),
    };
  }

  @Get('classes/:id/preview')
  @ApiOkResponse({ description: 'Get previewable modules only' })
  async getPublicClassPreview(@Param('id') id: string) {
    const classEntity = await this.classesService.findById(+id);
    
    if (!classEntity || !(classEntity as any).isPublicForSale) {
      return { data: [], error: 'Course not available' };
    }

    const allModules = await this.learningModulesService.list({ classId: +id });
    
    // Filter to only previewable modules with full content
    const previewModules = allModules.filter((module: any) => module.isPreviewable);
    
    return {
      data: previewModules,
    };
  }

  @Post('invoices/upload-proof')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Upload payment proof for latest unpaid invoice',
  })
  @HttpCode(HttpStatus.OK)
  async uploadPaymentProof(@Body() body: UploadProofDto) {
    const updated = await this.invoicesService.attachProofToLatestUnpaidInvoice(
      body.studentId,
      body.paymentProofUrl,
    );
    return { data: updated };
  }

  @Get('app-config')
  @ApiOkResponse({ description: 'Public app config' })
  async getPublicAppConfig() {
    // Return only safe fields for public consumption
    const app = await this.settingsService.getAppConfig();
    const business = await this.settingsService.getBusinessInfo();
    const social = await this.settingsService.getSocialMedia();
    return {
      data: {
        appName: app?.appName || 'LMS Portal',
        appTitle: app?.appTitle,
        metaDescription: app?.metaDescription,
        logoUrl: app?.logoNavbar || null,
        faviconUrl: app?.logoFavicon || null,
        primaryColor: '#00C7AB',
        defaultTimezone: app?.defaultTimezone,
        business: {
          companyLegalName: business?.companyLegalName,
          contactEmail: business?.contactEmail,
          contactPhone: business?.contactPhone,
          contactWebsite: business?.contactWebsite,
        },
        social: {
          facebook: social?.socialFacebook || null,
          twitter: social?.socialTwitter || null,
          linkedin: social?.socialLinkedin || null,
          instagram: social?.socialInstagram || null,
        },
      },
    };
  }
}
