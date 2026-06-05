import { NEGATED_BLACKLISTED_TAGS, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/lib/environment";
import { ALL_RATINGS_VALUE } from "@/lib/rule34_constants";
import { Favorite } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";
import { SearchQuery } from "@/lib/search/query/search_query";

const blacklistSearchQuery = new SearchQuery<Favorite>(NEGATED_BLACKLISTED_TAGS);

export function apply(favorites: Favorite[]): Favorite[] {
  return filterOutBlacklisted(filterByRating(favorites));
}

function filterOutBlacklisted(favorites: Favorite[]): Favorite[] {
  return USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? favorites : blacklistSearchQuery.filter(favorites);
}

function filterByRating(favorites: Favorite[]): Favorite[] {
  return areAllRatingsAllowed() ? favorites : favorites.filter(result => result.withinRating(Preferences.favoritesAllowedRatings.value));
}

function areAllRatingsAllowed(): boolean {
  return Preferences.favoritesAllowedRatings.value === ALL_RATINGS_VALUE;
}
