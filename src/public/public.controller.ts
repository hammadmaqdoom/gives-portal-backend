import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClassesService } from '../classes/classes.service';
import { InvoicesService } from '../invoices/invoices.service';
import { SettingsService } from '../settings/settings.service';
import { UploadProofDto } from './dto/upload-proof.dto';

@ApiTags('Public')
@Controller({
  path: 'public',
  version: '1',
})
export class PublicController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly invoicesService: InvoicesService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('classes')
  @ApiOkResponse({ description: 'Public classes list' })
  async getPublicClasses(@Query() query: any) {
    const page = Number(query?.page ?? 1);
    const limit = Number(query?.limit ?? 12);
    const data = await this.classesService.findManyWithPagination({
      filterOptions: query?.filters ?? null,
      sortOptions: null,
      paginationOptions: { page, limit },
    });
    return { data, meta: { page, limit, total: data.length } };
  }

  @Get('classes/:id')
  @ApiOkResponse({ description: 'Public class detail' })
  async getPublicClass(@Param('id') id: string) {
    const data = await this.classesService.findById(+id);
    return { data };
  }

  @Post('invoices/upload-proof')
  @ApiResponse({ status: HttpStatus.OK, description: 'Upload payment proof for latest unpaid invoice' })
  @HttpCode(HttpStatus.OK)
  async uploadPaymentProof(@Body() body: UploadProofDto) {
    const updated = await this.invoicesService.attachProofToLatestUnpaidInvoice(body.studentId, body.paymentProofUrl);
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


