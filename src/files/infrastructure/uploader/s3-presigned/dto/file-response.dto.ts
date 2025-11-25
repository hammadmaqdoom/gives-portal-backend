import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '../../../../domain/file';

export class FileResponseDto {
  @ApiProperty({
    type: () => File,
  })
  file: FileType;

  @ApiProperty({
    type: String,
  })
  uploadSignedUrl: string;
}
