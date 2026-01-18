import { ApiProperty } from '@nestjs/swagger';

export class UserRoleBreakdownDto {
  @ApiProperty({ example: 1234 })
  totalUsers: number;

  @ApiProperty({ example: 1000 })
  students: number;

  @ApiProperty({ example: 50 })
  teachers: number;

  @ApiProperty({ example: 10 })
  admins: number;

  @ApiProperty({ example: 1 })
  superAdmins: number;
}

export class StorageStatsDto {
  @ApiProperty({ example: 10737418240, description: 'Total storage in bytes' })
  totalStorageBytes: number;

  @ApiProperty({ example: '10 GB', description: 'Formatted total storage' })
  totalStorageFormatted: string;

  @ApiProperty({ example: 1000, description: 'Total number of files' })
  totalFiles: number;

  @ApiProperty({ example: 'S3', description: 'Storage provider (S3, B2, LOCAL, etc.)' })
  storageProvider: string;
}

export class SystemHealthDto {
  @ApiProperty({ example: 'healthy', description: 'System health status' })
  status: 'healthy' | 'degraded' | 'unhealthy';

  @ApiProperty({ example: true, description: 'Database connection status' })
  databaseConnected: boolean;

  @ApiProperty({ example: true, description: 'Storage connection status' })
  storageConnected: boolean;

  @ApiProperty({ example: 'All systems operational', description: 'Health message' })
  message: string;
}

export class SuperAdminStatsDto {
  @ApiProperty({ type: UserRoleBreakdownDto })
  userBreakdown: UserRoleBreakdownDto;

  @ApiProperty({ type: StorageStatsDto })
  storageStats: StorageStatsDto;

  @ApiProperty({ type: SystemHealthDto })
  systemHealth: SystemHealthDto;

  @ApiProperty({ example: 48 })
  totalClasses: number;

  @ApiProperty({ example: 856 })
  totalParents: number;

  @ApiProperty({ example: 125000 })
  totalRevenue: number;

  @ApiProperty({ example: 12340 })
  pendingFees: number;
}
