import { ApiProperty } from '@nestjs/swagger';

export class FeatureModule {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'students' })
  name: string;

  @ApiProperty({ example: 'Student Management' })
  displayName: string;

  @ApiProperty({ example: 'Manage students, enrollments, and student data' })
  description: string | null;

  @ApiProperty({ example: true })
  isEnabled: boolean;

  @ApiProperty({ example: 'solar:users-group-rounded-bold-duotone' })
  icon: string | null;

  @ApiProperty({ example: 'management' })
  category: string;

  @ApiProperty({ example: 'feature', enum: ['feature', 'settings_tab'] })
  moduleType: 'feature' | 'settings_tab';

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
