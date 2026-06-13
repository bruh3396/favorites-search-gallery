import * as FavoritesFilter from "@/features/favorites/model/search/filter";
import { Favorite } from "@/types/favorite";
import { shuffleArray } from "@/utils/collection/array";

let currentSearchResults: Favorite[] = [];

export const get = (): Favorite[] => currentSearchResults;
export const set = (results: Favorite[]): Favorite[] => (currentSearchResults = results);

export function invert(allFavorites: Favorite[]): Favorite[] {
  const ids = new Set(currentSearchResults.map(favorite => favorite.id));
  const inverted = allFavorites.filter(favorite => !ids.has(favorite.id));
  return (currentSearchResults = FavoritesFilter.apply(inverted));
}

export function shuffle(): Favorite[] {
  return (currentSearchResults = shuffleArray(currentSearchResults));
}

export function append(favorites: Favorite[]): Favorite[] {
  currentSearchResults = [...currentSearchResults, ...favorites];
  return favorites;
}

export function prepend(favorites: Favorite[]): Favorite[] {
  currentSearchResults = [...favorites, ...currentSearchResults];
  return favorites;
}
