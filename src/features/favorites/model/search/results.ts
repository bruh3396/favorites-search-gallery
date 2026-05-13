import * as FavoritesResultFilter from "./filter";
import { Favorite } from "../../../../types/favorite";
import { shuffleArray } from "../../../../utils/collection/array";

let currentSearchResults: Favorite[] = [];

export const get = (): Favorite[] => currentSearchResults;
export const set = (results: Favorite[]): Favorite[] => (currentSearchResults = results);

export function invert(allFavorites: Favorite[]): Favorite[] {
  const ids = new Set(currentSearchResults.map(favorite => favorite.id));
  const inverted = allFavorites.filter(favorite => !ids.has(favorite.id));
  return (currentSearchResults = FavoritesResultFilter.apply(inverted));
}

export function shuffle(): Favorite[] {
  return (currentSearchResults = shuffleArray(currentSearchResults));
}

export function append(favorites: Favorite[]): void {
  currentSearchResults = [...currentSearchResults, ...favorites];
}

export function prepend(newFavorites: Favorite[]): Favorite[] {
  currentSearchResults = [...newFavorites, ...currentSearchResults];
  return newFavorites;
}
