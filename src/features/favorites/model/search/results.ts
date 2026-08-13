import { Favorite } from "@/types/favorite";
import { doNothing } from "@/utils/function";
import { shuffleArray } from "@/utils/collection/array";

let currentSearchResults: Favorite[] = [];
let onChanged: (results: Favorite[]) => void = doNothing;

export function setup(onSearchResultsChanged: (results: Favorite[]) => void): void {
  onChanged = onSearchResultsChanged;
}

export function get(): Favorite[] {
  return currentSearchResults;
}

export function set(results: Favorite[]): Favorite[] {
  currentSearchResults = results;
  onChanged(currentSearchResults);
  return currentSearchResults;
}

export function invert(allFavorites: Favorite[]): Favorite[] {
  const ids = new Set(currentSearchResults.map(favorite => favorite.id));
  return allFavorites.filter(favorite => !ids.has(favorite.id));
}

export function shuffle(): Favorite[] {
  return set(shuffleArray(currentSearchResults));
}

export function append(favorites: Favorite[]): Favorite[] {
  set([...currentSearchResults, ...favorites]);
  return favorites;
}

export function prepend(favorites: Favorite[]): Favorite[] {
  set([...favorites, ...currentSearchResults]);
  return favorites;
}
