import { ALL_RATINGS_VALUE, FAVORITES_PER_PAGE } from "../../../../lib/global/constants";
import { FAVORITES_SEARCH_INDEX } from "./favorites_search_index";
import { FavoriteItem } from "../../types/favorite/favorite_item";
import { FavoritesSettings } from "../../../../config/favorites_settings";
import { Preferences } from "../../../../lib/global/preferences/preferences";
import { Rating } from "../../../../types/common_types";
import { SearchCommand } from "../../../../types/search_command";
import { USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../lib/global/flags/intrinsic_flags";
import { getTagBlacklist } from "../../../../utils/misc/favorites_page_metadata";
import { negateTags } from "../../../../utils/primitive/string";

const NEGATED_TAG_BLACKLIST = negateTags(getTagBlacklist());
const BLACKLIST_SEARCH_COMMAND = new SearchCommand<FavoriteItem>(NEGATED_TAG_BLACKLIST);
let searchQuery = "";
let useTagBlacklist = !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.excludeBlacklistEnabled.value;
let allowedRatings = Preferences.allowedRatings.value;
let searchCommand: SearchCommand<FavoriteItem> = createSearchCommand();

const allRatingsAreAllowed = (): boolean => allowedRatings === ALL_RATINGS_VALUE;

function getFinalSearchQuery(): string {
  return useTagBlacklist ? `${searchQuery} ${NEGATED_TAG_BLACKLIST}` : searchQuery;
}

function createSearchCommand(): SearchCommand<FavoriteItem> {
  return new SearchCommand(getFinalSearchQuery());
}

function updateSearchCommand(): void {
  searchCommand = createSearchCommand();
}

function shouldUseIndex(favorites: FavoriteItem[]): boolean {
  return FavoritesSettings.useSearchIndex && FAVORITES_SEARCH_INDEX.ready && !searchCommand.details.hasMetadataTag && favorites.length > FAVORITES_PER_PAGE;
}

export function filter(favorites: FavoriteItem[]): FavoriteItem[] {
  const results = shouldUseIndex(favorites) ? FAVORITES_SEARCH_INDEX.getSearchResults(searchCommand, favorites) : searchCommand.getSearchResults(favorites);
  return filterByRating(results);
}

export function filterByRating(favorites: FavoriteItem[]): FavoriteItem[] {
  return allRatingsAreAllowed() ? favorites : favorites.filter(result => result.withinRating(allowedRatings));
}

export function filterOutBlacklisted(favorites: FavoriteItem[]): FavoriteItem[] {
  return USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? favorites : BLACKLIST_SEARCH_COMMAND.getSearchResults(favorites);
}

export function setSearchQuery(newSearchQuery?: string): void {
  if (newSearchQuery !== undefined) {
    searchQuery = newSearchQuery;
    updateSearchCommand();
  }
}

export function useBlacklist(value: boolean): void {
  useTagBlacklist = value;
  updateSearchCommand();
}

export function setAllowedRatings(newAllowedRating: Rating): void {
  allowedRatings = newAllowedRating;
}
