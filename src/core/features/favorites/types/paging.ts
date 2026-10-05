import { Favorite } from "@/core/features/favorites/types/favorite";

export interface Page {
  favorites: readonly Favorite[];
  pageNumber: number;
  pageCount: number;
}
