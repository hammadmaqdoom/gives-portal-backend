import { ApiProperty } from '@nestjs/swagger';
import { FileType, File } from '../../files/domain/file';

export class PublicTeacherDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Dr. Smith' })
  name: string;

  @ApiProperty({
    example: [1, 2],
    description: 'Array of subject IDs that this teacher is allowed to teach',
  })
  subjectsAllowed: number[];

  @ApiProperty({ type: () => File, required: false })
  photo?: FileType | null;

  @ApiProperty({
    example:
      'Experienced educator with over 10 years of teaching mathematics and physics.',
    required: false,
  })
  bio?: string | null;

  @ApiProperty({
    example: false,
    description: 'Whether this teacher should be shown on the public website',
  })
  showOnPublicSite: boolean;

  @ApiProperty({
    example: 0,
    description:
      'Display order for public website (lower numbers appear first)',
  })
  displayOrder: number;
}

