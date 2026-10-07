import { PaginationResult, PaginationSettings } from "@/core/features/favorites/types/pagination";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { clamp } from "@/core/utils/number/number";

const INFINITE_SCROLL_PAGE_SIZE = 25;

interface PaginationInput {
  pageNumber: number;
  results: readonly Favorite[];
}

export function paginate({ size, infiniteScroll }: PaginationSettings, { pageNumber, results }: PaginationInput): PaginationResult {
  const pageSize = infiniteScroll ? INFINITE_SCROLL_PAGE_SIZE : Math.max(1, size);
  const totalResults = results.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const current = clamp(pageNumber, 1, totalPages);
  const startIndex = infiniteScroll ? 0 : (current - 1) * pageSize;
  return {
    favorites: results.slice(startIndex, current * pageSize),
    pageNumber: current,
    totalPages,
    totalResults
  };
}
