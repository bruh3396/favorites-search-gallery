import { BLACKLISTED_TAGS, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../lib/environment/favorites_metadata";
import { ALL_RATINGS_VALUE } from "../../../../lib/environment/constants";
import { Favorite } from "../../../../types/favorite";
import { FavoritesSearchEngine } from "./search_engine";
import { Preferences } from "../../../../lib/preferences/preferences";
import { SearchQuery } from "../../../../lib/search/query/search_query";
import { negateTags } from "../../../../utils/string/format";

const NEGATED_BLACKLISTED_TAGS = negateTags(BLACKLISTED_TAGS);
const blacklistSearchQuery = new SearchQuery<Favorite>(NEGATED_BLACKLISTED_TAGS);
let currentSearchQuery = "";
let searchQuery: SearchQuery<Favorite> = createSearchQuery();

export function filter(favorites: Favorite[]): Favorite[] {
  return filterByRating(FavoritesSearchEngine.search(searchQuery, favorites));
}

export function applyPostFilters(favorites: Favorite[]): Favorite[] {
  return filterOutBlacklisted(filterByRating(favorites));
}

export function updateSearchQuery(): void {
  searchQuery = createSearchQuery();
}

export function setSearchQuery(newSearchQuery?: string): void {
  if (newSearchQuery !== undefined) {
    currentSearchQuery = newSearchQuery;
    updateSearchQuery();
  }
}

export const addToIndex = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.add(f));
export const removeFromIndex = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.remove(f));
export const deferIndexing = (): void => FavoritesSearchEngine.deferIndexing();

function filterOutBlacklisted(favorites: Favorite[]): Favorite[] {
  return USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? favorites : blacklistSearchQuery.apply(favorites);
}

function filterByRating(favorites: Favorite[]): Favorite[] {
  return areAllRatingsAllowed() ? favorites : favorites.filter(result => result.withinRating(Preferences.allowedRatings.value));
}

function createSearchQuery(): SearchQuery<Favorite> {
  return new SearchQuery(finalSearchQuery());
}

function finalSearchQuery(): string {
  return shouldUseBlacklist() ? `${currentSearchQuery} ${NEGATED_BLACKLISTED_TAGS}` : currentSearchQuery;
}

function shouldUseBlacklist(): boolean {
  return !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.excludeBlacklist.value;
}

function areAllRatingsAllowed(): boolean {
  return Preferences.allowedRatings.value === ALL_RATINGS_VALUE;
}
