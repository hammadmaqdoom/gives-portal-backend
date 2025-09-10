import { Exclude, Expose } from 'class-transformer';
import { FileType } from '../../files/domain/file';
import { Role } from '../../roles/domain/role';
import { Status } from '../../statuses/domain/status';
import { ApiProperty } from '@nestjs/swagger';

const idType = Number;

export class User {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'john.doe@example.com',
  })
  @Expose({ groups: ['me', 'admin'] })
  email: string | null;

  @Exclude({ toPlainOnly: true })
  password?: string;

  @ApiProperty({
    type: String,
    example: 'email',
  })
  @Expose({ groups: ['me', 'admin'] })
  provider: string;

  @ApiProperty({
    type: String,
    example: '1234567890',
  })
  @Expose({ groups: ['me', 'admin'] })
  socialId?: string | null;

  @ApiProperty({
    type: String,
    example: 'John',
  })
  firstName: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
  })
  lastName: string | null;

  @ApiProperty({
    type: () => File,
  })
  photo?: FileType | null;

  @ApiProperty({
    type: () => Role,
  })
  role?: Role | null;

  @ApiProperty({
    type: () => Status,
  })
  status?: Status;

  @ApiProperty({
    type: String,
    example: '+1234567890',
    required: false,
  })
  phone?: string | null;

  @ApiProperty({
    type: String,
    example: 'Software developer with 5 years of experience',
    required: false,
  })
  bio?: string | null;

  @ApiProperty({
    type: String,
    example: '123 Main St',
    required: false,
  })
  address?: string | null;

  @ApiProperty({
    type: String,
    example: 'New York',
    required: false,
  })
  city?: string | null;

  @ApiProperty({
    type: String,
    example: 'United States',
    required: false,
  })
  country?: string | null;

  @ApiProperty({
    type: String,
    example: '1990-01-01',
    required: false,
  })
  dateOfBirth?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
