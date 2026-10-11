import { Favorite } from "@/core/features/favorites/favorite";
import { clamp } from "@/core/utils/number/number";

export interface PaginationSettings {
  readonly size: number;
  readonly infiniteScroll: boolean;
}

export interface PaginationResult {
  readonly favorites: readonly Favorite[];
  readonly pageNumber: number;
  readonly totalPages: number;
  readonly totalResults: number;
}

const INFINITE_SCROLL_PAGE_SIZE = 25;

export function getPageSize({ size, infiniteScroll }: PaginationSettings): number {
  return infiniteScroll ? INFINITE_SCROLL_PAGE_SIZE : Math.max(1, size);
}

export function paginate(settings: PaginationSettings, results: readonly Favorite[], pageNumber: number): PaginationResult {
  const pageSize = getPageSize(settings);
  const totalResults = results.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const current = clamp(pageNumber, 1, totalPages);
  const startIndex = settings.infiniteScroll ? 0 : (current - 1) * pageSize;
  return {
    favorites: results.slice(startIndex, current * pageSize),
    pageNumber: current,
    totalPages,
    totalResults
  };
}
