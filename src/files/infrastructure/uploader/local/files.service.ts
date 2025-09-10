import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FileRepository } from '../../persistence/file.repository';
import { AllConfigType } from '../../../../config/config.type';
import { FileType } from '../../../domain/file';

@Injectable()
export class FilesLocalService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly fileRepository: FileRepository,
  ) {}

  async create(file: Express.Multer.File): Promise<{ file: FileType }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'selectFile',
        },
      });
    }

    return {
      file: await this.fileRepository.create({
        filename: file.filename,
        originalName: file.originalname,
        path: `/${this.configService.get('app.apiPrefix', {
          infer: true,
        })}/v1/${file.path}`,
        size: file.size,
        mimeType: file.mimetype,
        uploadedBy: 'system',
        uploadedAt: new Date(),
        contextType: 'local',
        contextId: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      }),
    };
  }
}
