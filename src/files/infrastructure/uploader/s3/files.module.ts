import {
  HttpStatus,
  Module,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FilesS3Controller } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

import { FilesS3Service } from './files.service';
import { RelationalFilePersistenceModule } from '../../persistence/relational/relational-persistence.module';
import { AllConfigType } from '../../../../config/config.type';
import { FileDriver } from '../../../config/file-config.type';

const infrastructurePersistenceModule = RelationalFilePersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const driver =
          (configService.get('file.driver', { infer: true }) as FileDriver) ||
          FileDriver.LOCAL;
        const isB2Driver =
          driver === FileDriver.B2 || driver === FileDriver.B2_PRESIGNED;

        // B2-specific configuration
        const endpointUrl = isB2Driver
          ? configService.get('file.b2EndpointUrl', { infer: true })
          : undefined;
        const region = isB2Driver
          ? configService.get('file.b2Region', { infer: true }) || 'us-west-001'
          : configService.get('file.awsS3Region', { infer: true });

        const clientConfig: any = {
          region,
          credentials: {
            accessKeyId: configService.getOrThrow('file.accessKeyId', {
              infer: true,
            }),
            secretAccessKey: configService.getOrThrow('file.secretAccessKey', {
              infer: true,
            }),
          },
        };

        // Add endpoint for B2
        if (isB2Driver && endpointUrl) {
          clientConfig.endpoint = endpointUrl;
          clientConfig.forcePathStyle = false; // B2 supports virtual-host style
        }

        const s3 = new S3Client(clientConfig);

        return {
          // Allow common document, archive, and media types in addition to images
          fileFilter: (request, file, callback) => {
            const allowed =
              /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|mp4|mov|avi|mkv|webm|zip|rar|7z|tar|gz)$/i;
            if (!allowed.test(file.originalname)) {
              return callback(
                new UnprocessableEntityException({
                  status: HttpStatus.UNPROCESSABLE_ENTITY,
                  errors: {
                    file: `cantUploadFileType`,
                  },
                }),
                false,
              );
            }

            callback(null, true);
          },
          storage: multerS3({
            s3: s3,
            bucket: configService.getOrThrow('file.awsDefaultS3Bucket', {
              infer: true,
            }),
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key: (request, file, callback) => {
              callback(
                null,
                `${randomStringGenerator()}.${file.originalname
                  .split('.')
                  .pop()
                  ?.toLowerCase()}`,
              );
            },
          }),
          limits: {
            fileSize: configService.get('file.maxFileSize', { infer: true }),
          },
        };
      },
    }),
  ],
  controllers: [FilesS3Controller],
  providers: [FilesS3Service],
  exports: [FilesS3Service],
})
export class FilesS3Module {}
