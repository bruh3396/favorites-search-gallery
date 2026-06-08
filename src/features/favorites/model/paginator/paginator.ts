import { Favorite } from "@/types/favorite";
import { FavoritesConfig } from "@/config/favorites_config";
import { NavigationKey } from "@/types/input";
import { PaginationContext } from "@/features/favorites/types/interfaces";
import { Preferences } from "@/app/context/preferences";
import { clamp } from "@/utils/number";
import { navigationDelta } from "@/utils/navigation";
import { paginationContext } from "@/features/favorites/model/paginator/context";

let current = 1;
let favorites: Favorite[] = [];

export const onFinal = (): boolean => current === pageCount();
export const currentFavorites = (): Favorite[] => favoritesOnPage(current);
export const adjacentFavorites = (): Favorite[] => [...favoritesOnPage(current - 1), ...favoritesOnPage(current + 1)];
export const context = (): PaginationContext => paginationContext(current, pageCount(), favorites.length, resultsPerPage(), FavoritesConfig.nearbyPageCount);
export const selectAdjacent = (direction: NavigationKey): boolean => select(wrappedPage(current, navigationDelta(direction), pageCount()));

export function select(pageNumber: number): boolean {
  const target = clamp(pageNumber, 1, pageCount());
  const changed = target !== current;

  current = target;
  return changed;
}

export function paginate(newFavorites: Favorite[]): void {
  favorites = newFavorites;
}

export function selectContaining(id: string): boolean {
  const index = favorites.findIndex(f => f.id === id);

  if (index === -1) {
    return false;
  }
  return select(Math.floor(index / resultsPerPage()) + 1);
}

const pageCount = (): number => Math.ceil(favorites.length / resultsPerPage()) || 1;
const pageRange = (c: number): {start: number, end: number} => ({ start: resultsPerPage() * (c - 1), end: resultsPerPage() * c });
const favoritesOnPage = (c: number): Favorite[] => favorites.slice(pageRange(c).start, pageRange(c).end);
const resultsPerPage = (): number => Preferences.favoritesResultsPerPage.value;
const wrappedPage = (page: number, delta: number, total: number): number => ((page - 1 + delta + total) % total) + 1;
