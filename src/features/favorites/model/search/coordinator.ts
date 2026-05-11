import * as FavoritesResults from "./results";
import * as FavoritesSearchEngine from "./engine";
import * as FavoritesSorter from "./sorter";
import { NEGATED_BLACKLISTED_TAGS, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../lib/environment/favorites_metadata";
import { Favorite } from "../../../../types/favorite";
import { Preferences } from "../../../../lib/preferences/preferences";
import { SearchQuery } from "../../../../lib/search/query/search_query";

let currentSearchQuery = "";

export function searchFavorites(allFavorites: Favorite[], searchQuery?: string): Favorite[] {
  currentSearchQuery = searchQuery ?? currentSearchQuery;
  return FavoritesResults.set(FavoritesSorter.sortFavorites(search(allFavorites)));
}

export const invertSearchResults = FavoritesResults.invert;
export const shuffleSearchResults = FavoritesResults.shuffle;
export const getLatestSearchResults = FavoritesResults.get;
export const deferIndexing = FavoritesSearchEngine.deferIndexing;
export const appendSearchResults = (favorites: Favorite[]): void => FavoritesResults.append(search(favorites));
export const prependSearchResults = (newFavorites: Favorite[]): Favorite[] => FavoritesResults.prepend(search(newFavorites));
export const addToIndex = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.add(f));
export const removeFromIndex = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.remove(f));

function buildQuery(): SearchQuery<Favorite> {
  const shouldUseBlacklist = !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.excludeBlacklist.value;
  return new SearchQuery<Favorite>(shouldUseBlacklist ? `${currentSearchQuery} ${NEGATED_BLACKLISTED_TAGS}` : currentSearchQuery);
}

function search(favorites: Favorite[]): Favorite[] {
  return FavoritesSearchEngine.search(buildQuery(), favorites);
}
