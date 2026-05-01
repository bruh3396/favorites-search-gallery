import * as FavoritesSearchEngine from "./favorites_search_engine";
import { ALL_RATINGS_VALUE, FAVORITES_PER_PAGE } from "../../../../lib/environment/constants";
import { FavoriteItem } from "../../type/favorite_item";
import { FavoritesSettings } from "../../../../config/favorites_settings";
import { Preferences } from "../../../../lib/preferences/preferences";
import { SearchQuery } from "../../../../lib/search/query/search_query";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../lib/environment/environment";
import { getTagBlacklist } from "../../../../lib/environment/favorites_metadata";
import { negateTags } from "../../../../utils/string/format";

const NEGATED_TAG_BLACKLIST = negateTags(getTagBlacklist());
const BLACKLIST_SEARCH_QUERY = new SearchQuery<FavoriteItem>(NEGATED_TAG_BLACKLIST);
let rawSearchQuery = "";

const useBlacklist = (): boolean => !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.excludeBlacklist.value;
const allRatingsAllowed = (): boolean => Preferences.allowedRatings.value === ALL_RATINGS_VALUE;
const getFinalSearchQuery = (): string => (useBlacklist() ? `${rawSearchQuery} ${NEGATED_TAG_BLACKLIST}` : rawSearchQuery);
const createSearchQuery = (): SearchQuery<FavoriteItem> => new SearchQuery(getFinalSearchQuery());

let searchQuery: SearchQuery<FavoriteItem> = createSearchQuery();

function updateSearchQuery(): void {
  searchQuery = createSearchQuery();
}

function shouldUseEngine(favorites: FavoriteItem[]): boolean {
  return FavoritesSettings.useSearchEngine && FavoritesSearchEngine.ready && !searchQuery.metadata.hasMetadataTag && favorites.length > FAVORITES_PER_PAGE;
}

function filterOutBlacklisted(favorites: FavoriteItem[]): FavoriteItem[] {
  return USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? favorites : BLACKLIST_SEARCH_QUERY.apply(favorites);
}

function filterByRating(favorites: FavoriteItem[]): FavoriteItem[] {
  const allowedRatings = Preferences.allowedRatings.value;
  return allRatingsAllowed() ? favorites : favorites.filter(result => result.withinRating(allowedRatings));
}

export function filter(favorites: FavoriteItem[]): FavoriteItem[] {
  const results = shouldUseEngine(favorites) ? FavoritesSearchEngine.search(searchQuery, favorites) : searchQuery.apply(favorites);
  return filterByRating(results);
}

export function applyPostFilters(favorites: FavoriteItem[]): FavoriteItem[] {
  return filterOutBlacklisted(filterByRating(favorites));
}

export function setSearchQuery(newSearchQuery?: string): void {
  if (newSearchQuery !== undefined) {
    rawSearchQuery = newSearchQuery;
    updateSearchQuery();
  }
}

export const onBlacklistChanged = (): void => updateSearchQuery();
