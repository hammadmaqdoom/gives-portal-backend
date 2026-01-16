import { ApiProperty } from '@nestjs/swagger';

export class DiscountByTypeDto {
  @ApiProperty({ example: 'manual' })
  type: string;

  @ApiProperty({ example: 500.0 })
  totalAmount: number;

  @ApiProperty({ example: 10 })
  count: number;

  @ApiProperty({ example: 50.0 })
  averageAmount: number;

  @ApiProperty({ example: 'USD' })
  currency: string;
}

export class DiscountAnalyticsDto {
  @ApiProperty({ type: [DiscountByTypeDto] })
  discountsByType: DiscountByTypeDto[];

  @ApiProperty({ example: 25 })
  totalDiscounts: number;

  @ApiProperty({ example: 1250.0 })
  totalDiscountAmount: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: { start: '2024-01-01', end: '2024-12-31' } })
  dateRange: {
    start: Date;
    end: Date;
  };
}
