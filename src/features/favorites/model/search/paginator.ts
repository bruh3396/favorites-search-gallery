import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { NavigationKey } from "@/types/input";
import { PaginationState } from "@/features/favorites/types/types";
import { Preferences } from "@/app/context/preferences";
import { clamp } from "@/utils/number";
import { navigationDelta } from "@/utils/navigation";
import { paginationSequence } from "@/lib/ui/pagination";

let current = 1;
let favorites: Favorite[] = [];

export const atFinalPage = (): boolean => current === pageCount();
export const hasOnlyOnePage = (): boolean => pageCount() === 1;
export const currentPageFavorites = (): Favorite[] => favoritesOnPage(current);
export const adjacentPageFavorites = (): Favorite[] => [...favoritesOnPage(current - 1), ...favoritesOnPage(current + 1)];
export const selectAdjacentPage = (direction: NavigationKey): boolean => selectPage(current + navigationDelta(direction));
export const selectWrappedAdjacentPage = (direction: NavigationKey): boolean => selectPage(wrappedPage(current, navigationDelta(direction), pageCount()));
export const paginate = (newFavorites: Favorite[]): Favorite[] => (favorites = newFavorites);

export function selectPage(pageNumber: number): boolean {
  const target = clamp(pageNumber, 1, pageCount());
  const wasChanged = target !== current;

  current = target;
  return wasChanged;
}

export function selectPageContaining(id: string): boolean {
  const index = favorites.findIndex(f => f.id === id);
  return index !== -1 && selectPage(Math.floor(index / resultsPerPage()) + 1);
}

export function paginationState(): PaginationState {
  return {
    currentPage: current,
    finalPage: pageCount(),
    totalCount: favorites.length,
    sliceStart: resultsPerPage() * (current - 1),
    sliceEnd: resultsPerPage() * current,
    sequence: paginationSequence(current, pageCount(), FavoritesConfig.nearbyPageCount)
  };
}

const pageCount = (): number => Math.ceil(favorites.length / resultsPerPage()) || 1;
const pageRange = (c: number): {start: number; end: number} => ({ start: resultsPerPage() * (c - 1), end: resultsPerPage() * c });
const favoritesOnPage = (c: number): Favorite[] => favorites.slice(pageRange(c).start, pageRange(c).end);
const resultsPerPage = (): number => Preferences.favorites.resultsPerPage.value;
const wrappedPage = (page: number, delta: number, total: number): number => ((page - 1 + delta + total) % total) + 1;
