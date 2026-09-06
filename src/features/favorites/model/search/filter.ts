import * as FavoritesRating from "@/features/favorites/model/search/rating";
import { NEGATED_BLACKLISTED_TAGS, USER_IS_ON_THEIR_OWN_FAVORITES_PAGE } from "@/lib/environment";
import { ALL_RATINGS_VALUE } from "@/lib/rule34_constants";
import { Favorite } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";
import { SearchQuery } from "@/lib/search/engine/search_query";

const blacklistSearchQuery = new SearchQuery<Favorite>(NEGATED_BLACKLISTED_TAGS);

export function filterByRating(favorites: Favorite[]): Favorite[] {
  return areAllRatingsAllowed() ? favorites : favorites.filter(favorite => FavoritesRating.isRatingAllowed(favorite.post.rating, Preferences.favorites.allowedRatings.value));
}

export function filterOutBlacklisted(favorites: Favorite[]): Favorite[] {
  return USER_IS_ON_THEIR_OWN_FAVORITES_PAGE ? favorites : blacklistSearchQuery.filter(favorites);
}

function areAllRatingsAllowed(): boolean {
  return Preferences.favorites.allowedRatings.value === ALL_RATINGS_VALUE;
}
