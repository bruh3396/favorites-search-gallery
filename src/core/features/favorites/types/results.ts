import { Favorite } from "@/core/features/favorites/types/favorite";

export interface ResultsState {
  matches: Favorite[];
  pageNumber: number;
}
