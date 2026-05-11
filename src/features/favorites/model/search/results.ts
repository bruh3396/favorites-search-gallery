import * as FavoritesResultFilter from "./filter";
import { Favorite } from "../../../../types/favorite";
import { shuffleArray } from "../../../../utils/collection/array";

let latestSearchResults: Favorite[] = [];

export const get = (): Favorite[] => latestSearchResults;
export const set = (results: Favorite[]): Favorite[] => (latestSearchResults = results);

export function invert(allFavorites: Favorite[]): Favorite[] {
  const ids = new Set(latestSearchResults.map(favorite => favorite.id));
  const inverted = allFavorites.filter(favorite => !ids.has(favorite.id));
  return (latestSearchResults = FavoritesResultFilter.apply(inverted));
}

export function shuffle(): Favorite[] {
  return (latestSearchResults = shuffleArray(latestSearchResults));
}

export function append(favorites: Favorite[]): void {
  latestSearchResults = [...latestSearchResults, ...favorites];
}

export function prepend(newFavorites: Favorite[]): Favorite[] {
  latestSearchResults = [...newFavorites, ...latestSearchResults];
  return newFavorites;
}
