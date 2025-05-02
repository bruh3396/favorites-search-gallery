import {FAVORITES_SEARCH_INDEX} from "../index/favorites_search_index";
import {FavoriteItem} from "../../../types/favorite/favorite_item";
// import {InvertedIndex} from "../favorites_search_index";
// import {InvertedSearchIndex} from "../search_command/indexed_search_command";
import {Preferences} from "../../../../../store/preferences/preferences";
import {Rating} from "../../../../../types/primitives/primitives";
import {SearchCommand} from "../search_command/search_command";
import {USER_IS_ON_THEIR_OWN_FAVORITES_PAGE} from "../../../../../lib/functional/flags";
import {getTagBlacklist} from "../../../../../utils/misc/metadata";
import {negateTags} from "../../../../../utils/primitive/string";

const NEGATED_TAG_BLACKLIST = negateTags(getTagBlacklist());
let searchQuery = "";
let useTagBlacklist = !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.excludeBlacklist.value;
let allowedRatings = Preferences.allowedRatings.value;
let searchCommand: SearchCommand<FavoriteItem> = createSearchCommand();

export function allRatingsAreAllowed(): boolean {
  return allowedRatings === 7;
}

export function getFinalSearchQuery(): string {
  return useTagBlacklist ? `${searchQuery} ${NEGATED_TAG_BLACKLIST}` : searchQuery;
}

export function filter(favorites: FavoriteItem[]): FavoriteItem[] {
  const results = favorites.length > 50 ? FAVORITES_SEARCH_INDEX.getSearchResults(searchCommand, favorites) : searchCommand.getSearchResults(favorites);
  return filterByRating(results);
}

export function filterByRating(favorites: FavoriteItem[]): FavoriteItem[] {
  return allRatingsAreAllowed() ? favorites : favorites;
  // return allRatingsAreAllowed() ? favorites : favorites.filter(result => result.withinRating(allowedRatings));
}

export function filterOutBlacklisted(favorites: FavoriteItem[]): FavoriteItem[] {
  return favorites;
  // return USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? favorites : new SearchCommand(NEGATED_TAG_BLACKLIST).getSearchResults(favorites);
}

export function setSearchQuery(newSearchQuery: string): void {
  searchQuery = newSearchQuery;
  createSearchCommand();
}

export function toggleBlacklistFiltering(value: boolean): void {
  useTagBlacklist = value;
  // search here
}

function createSearchCommand(): SearchCommand<FavoriteItem> {
  searchCommand = new SearchCommand(getFinalSearchQuery());
  return searchCommand;
}

export function setAllowedRatings(newAllowedRating: Rating): void {
  allowedRatings = newAllowedRating;
}
