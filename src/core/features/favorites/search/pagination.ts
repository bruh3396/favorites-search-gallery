import { Favorite } from "@/core/features/favorites/favorite";
import { clamp } from "@/core/utils/number/number";

export interface PaginationSettings {
  size: number;
  infiniteScroll: boolean;
}

export interface PaginationResult {
  favorites: readonly Favorite[];
  pageNumber: number;
  totalPages: number;
  totalResults: number;
}

const INFINITE_SCROLL_PAGE_SIZE = 25;

export function paginate({ size, infiniteScroll }: PaginationSettings, results: readonly Favorite[], pageNumber: number): PaginationResult {
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
