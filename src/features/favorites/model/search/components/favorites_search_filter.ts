import { FAVORITES_SEARCH_INDEX } from "../index/favorites_search_index";
import { FavoriteItem } from "../../../types/favorite/favorite_item";
import { FavoritesSettings } from "../../../../../config/favorites_settings";
import { Preferences } from "../../../../../store/local_storage/preferences";
import { Rating } from "../../../../../types/primitives/primitives";
import { SearchCommand } from "../search_command/search_command";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../../lib/globals/flags";
import { getTagBlacklist } from "../../../../../utils/misc/favorites_page_metadata";
import { negateTags } from "../../../../../utils/primitive/string";

const NEGATED_TAG_BLACKLIST = negateTags(getTagBlacklist());
let searchQuery = "";
let useTagBlacklist = !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.excludeBlacklistEnabled.value;
let allowedRatings = Preferences.allowedRatings.value;
let searchCommand: SearchCommand<FavoriteItem> = updateSearchCommand();

function allRatingsAreAllowed(): boolean {
  return allowedRatings === 7;
}

function getFinalSearchQuery(): string {
  return useTagBlacklist ? `${searchQuery} ${NEGATED_TAG_BLACKLIST}` : searchQuery;
}

function updateSearchCommand(): SearchCommand<FavoriteItem> {
  searchCommand = new SearchCommand(getFinalSearchQuery());
  return searchCommand;
}

function shouldUseIndex(favorites: FavoriteItem[]): boolean {
  return FavoritesSettings.useSearchIndex && !searchCommand.details.hasMetadataTag && favorites.length > 50;
}

export function filter(favorites: FavoriteItem[]): FavoriteItem[] {
  const results = shouldUseIndex(favorites) ? FAVORITES_SEARCH_INDEX.getSearchResults(searchCommand, favorites) : searchCommand.getSearchResults(favorites);
  return filterByRating(results);
}

export function filterByRating(favorites: FavoriteItem[]): FavoriteItem[] {
  return allRatingsAreAllowed() ? favorites : favorites.filter(result => result.withinRating(allowedRatings));
}

export function filterOutBlacklisted(favorites: FavoriteItem[]): FavoriteItem[] {
  return USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? favorites : new SearchCommand<FavoriteItem>(NEGATED_TAG_BLACKLIST).getSearchResults(favorites);
}

export function setSearchQuery(newSearchQuery: string): void {
  searchQuery = newSearchQuery;
  updateSearchCommand();
}

export function toggleBlacklistFiltering(value: boolean): void {
  useTagBlacklist = value;
  updateSearchCommand();
}

export function setAllowedRatings(newAllowedRating: Rating): void {
  allowedRatings = newAllowedRating;
}
