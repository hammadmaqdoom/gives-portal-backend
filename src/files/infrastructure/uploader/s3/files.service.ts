import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileRepository } from '../../persistence/file.repository';
import { FileType } from '../../../domain/file';

@Injectable()
export class FilesS3Service {
  constructor(private readonly fileRepository: FileRepository) {}

  async create(file: Express.MulterS3.File): Promise<{ file: FileType }> {
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
        filename: file.key.split('/').pop() || file.key,
        originalName: file.key.split('/').pop() || file.key,
        path: file.key,
        size: file.size || 0,
        mimeType: file.mimetype || 'application/octet-stream',
        uploadedBy: 'system',
        uploadedAt: new Date(),
        contextType: 's3',
        contextId: 's3',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      }),
    };
  }
}
