import {FavoriteItem} from "../../types/favorite/favorite";
import {Preferences} from "../../../../store/preferences/preferences";
import {Rating} from "../../../../types/primitives/primitives";
import {SearchCommand} from "./search_command";
import {USER_IS_ON_THEIR_OWN_FAVORITES_PAGE} from "../../../../lib/functional/flags";
import {getTagBlacklist} from "../../../../utils/misc/metadata";
import {negateTags} from "../../../../utils/primitive/string";

const NEGATED_TAG_BLACKLIST = negateTags(getTagBlacklist());
let searchQuery = "";
let useTagBlacklist = !USER_IS_ON_THEIR_OWN_FAVORITES_PAGE || Preferences.excludeBlacklist.value;
let allowedRatings = Preferences.allowedRatings.value;
let searchCommand = createSearchCommand();

function allRatingsAreAllowed(): boolean {
  return allowedRatings === 7;
}

function getFinalSearchQuery(): string {
  return useTagBlacklist ? `${searchQuery} ${NEGATED_TAG_BLACKLIST}` : searchQuery;
}

function filter(favorites: FavoriteItem[]): FavoriteItem[] {
  const results = searchCommand.getSearchResults(favorites);
  return filterByRating(results);
}

function filterByRating(favorites: FavoriteItem[]): FavoriteItem[] {
  return allRatingsAreAllowed() ? favorites : favorites;
  // return allRatingsAreAllowed() ? favorites : favorites.filter(result => result.withinRating(allowedRatings));
}

function filterOutBlacklisted(favorites: FavoriteItem[]): FavoriteItem[] {
  return USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? favorites : new SearchCommand(NEGATED_TAG_BLACKLIST).getSearchResults(favorites);
}

function setSearchQuery(newSearchQuery: string): void {
  searchQuery = newSearchQuery;
  searchCommand = createSearchCommand();
}

function createSearchCommand():SearchCommand {
  return new SearchCommand(getFinalSearchQuery());
}

function toggleBlacklistFiltering(value: boolean): void {
  useTagBlacklist = value;
  searchCommand = createSearchCommand();
}

function setAllowedRatings(newAllowedRating: Rating): void {
  allowedRatings = newAllowedRating;
}

export const FavoritesFilter = {
  filter,
  filterByRating,
  setSearchQuery,
  filterOutBlacklisted,
  toggleBlacklistFiltering,
  setAllowedRatings
};
