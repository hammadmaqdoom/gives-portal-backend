import { IPaginationOptions } from './types/pagination-options';

export const MAX_PAGINATION_LIMIT = 100;
export const DEFAULT_PAGINATION_LIMIT = 10;

export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

/**
 * Clamp user-supplied pagination to a safe server-side ceiling.
 *
 * Prevents runaway queries like `?limit=10000` from hydrating every row with
 * joined relations and blowing the Node heap.
 */
export function normalizePagination(
  options: Partial<IPaginationOptions> | null | undefined,
  maxLimit: number = MAX_PAGINATION_LIMIT,
): NormalizedPagination {
  const rawPage = Number(options?.page);
  const rawLimit = Number(options?.limit);

  const page =
    Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), maxLimit)
      : DEFAULT_PAGINATION_LIMIT;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}
