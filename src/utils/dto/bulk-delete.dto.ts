import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayNotEmpty, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkDeleteDto {
  @ApiProperty({
    type: [Number],
    description: 'Array of ids to delete',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  ids: number[];
}

export class BulkDeleteResultDto {
  @ApiProperty({ example: 3 })
  requested: number;

  @ApiProperty({ example: 2 })
  deleted: number;

  @ApiProperty({ example: 1 })
  failed: number;

  @ApiProperty({ type: [Number], example: [1, 2] })
  succeededIds: number[];

  @ApiProperty({
    example: [{ id: 3, error: 'Not found' }],
  })
  failedItems: Array<{ id: number; error: string }>;
}

/**
 * Helper to perform bulk deletion given a single-delete function.
 * Runs each deletion via Promise.allSettled so partial failures are preserved.
 */
export async function performBulkDelete(
  ids: Array<number | string>,
  removeFn: (id: number) => Promise<unknown>,
): Promise<BulkDeleteResultDto> {
  const uniqueIds = Array.from(
    new Set(
      (ids || []).map((id) => (typeof id === 'number' ? id : parseInt(String(id), 10))),
    ),
  ).filter((id) => !Number.isNaN(id));

  const results = await Promise.allSettled(
    uniqueIds.map((id) => removeFn(id).then(() => id)),
  );

  const succeededIds: number[] = [];
  const failedItems: Array<{ id: number; error: string }> = [];

  results.forEach((result, index) => {
    const id = uniqueIds[index];
    if (result.status === 'fulfilled') {
      succeededIds.push(id);
    } else {
      const reason: any = result.reason;
      const message =
        reason?.response?.message ||
        reason?.message ||
        (typeof reason === 'string' ? reason : 'Unknown error');
      failedItems.push({ id, error: String(message) });
    }
  });

  return {
    requested: uniqueIds.length,
    deleted: succeededIds.length,
    failed: failedItems.length,
    succeededIds,
    failedItems,
  };
}
