import { NEGATED_BLACKLISTED_TAGS, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "../../../../lib/environment/favorites_metadata";
import { ALL_RATINGS_VALUE } from "../../../../lib/environment/constants";
import { Favorite } from "../../../../types/favorite";
import { Preferences } from "../../../../lib/preferences/preferences";
import { SearchQuery } from "../../../../lib/search/query/search_query";

const blacklistSearchQuery = new SearchQuery<Favorite>(NEGATED_BLACKLISTED_TAGS);

export function apply(favorites: Favorite[]): Favorite[] {
  return filterOutBlacklisted(filterByRating(favorites));
}

function filterOutBlacklisted(favorites: Favorite[]): Favorite[] {
  return USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? favorites : blacklistSearchQuery.filter(favorites);
}

function filterByRating(favorites: Favorite[]): Favorite[] {
  return areAllRatingsAllowed() ? favorites : favorites.filter(result => result.withinRating(Preferences.allowedRatings.value));
}

function areAllRatingsAllowed(): boolean {
  return Preferences.allowedRatings.value === ALL_RATINGS_VALUE;
}
