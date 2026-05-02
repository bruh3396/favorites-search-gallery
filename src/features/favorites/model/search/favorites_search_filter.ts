import { ALL_RATINGS_VALUE } from "../../../../lib/environment/constants";
import { Favorite } from "../../../../types/favorite";
import { FavoritesSearchEngine } from "./favorites_search_engine";
import { Preferences } from "../../../../lib/preferences/preferences";
import { SearchQuery } from "../../../../lib/search/query/search_query";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../lib/environment/environment";
import { getTagBlacklist } from "../../../../lib/environment/favorites_metadata";
import { negateTags } from "../../../../utils/string/format";

const NEGATED_TAG_BLACKLIST = negateTags(getTagBlacklist());
const blacklistSearchQuery = new SearchQuery<Favorite>(NEGATED_TAG_BLACKLIST);
let currentSearchQuery = "";

const shouldUseBlacklist = (): boolean => !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.excludeBlacklist.value;
const areAllRatingsAllowed = (): boolean => Preferences.allowedRatings.value === ALL_RATINGS_VALUE;
const finalSearchQuery = (): string => (shouldUseBlacklist() ? `${currentSearchQuery} ${NEGATED_TAG_BLACKLIST}` : currentSearchQuery);
const createSearchQuery = (): SearchQuery<Favorite> => new SearchQuery(finalSearchQuery());

let searchQuery: SearchQuery<Favorite> = createSearchQuery();

function updateSearchQuery(): void {
  searchQuery = createSearchQuery();
}

function filterOutBlacklisted(favorites: Favorite[]): Favorite[] {
  return USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? favorites : blacklistSearchQuery.apply(favorites);
}

function filterByRating(favorites: Favorite[]): Favorite[] {
  return areAllRatingsAllowed() ? favorites : favorites.filter(result => result.withinRating(Preferences.allowedRatings.value));
}

export function filter(favorites: Favorite[]): Favorite[] {
  return filterByRating(FavoritesSearchEngine.search(searchQuery, favorites));
}

export function applyPostFilters(favorites: Favorite[]): Favorite[] {
  return filterOutBlacklisted(filterByRating(favorites));
}

export function setSearchQuery(newSearchQuery?: string): void {
  if (newSearchQuery !== undefined) {
    currentSearchQuery = newSearchQuery;
    updateSearchQuery();
  }
}

export const onBlacklistChanged = (): void => updateSearchQuery();
export const index = (favorites: Favorite[]): void => favorites.forEach(f => FavoritesSearchEngine.add(f));
export const deferSearchEngineIndexing = (): void => FavoritesSearchEngine.deferIndexing();
