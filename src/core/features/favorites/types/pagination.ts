import { Favorite } from "@/core/features/favorites/types/favorite";

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
