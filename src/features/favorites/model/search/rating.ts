import { DiscreteRating, Rating } from "@/types/search";
import { ALL_RATINGS_VALUE } from "@/lib/rule34_constants";
import { Favorite } from "@/types/favorite";

const RATINGS_BY_INITIAL: Record<string, Rating> = {
  e: DiscreteRating.Explicit,
  q: DiscreteRating.Questionable,
  s: DiscreteRating.Safe
};

export function decodeRating(rating: string): Rating {
  return RATINGS_BY_INITIAL[rating.charAt(0).toLowerCase()] ?? DiscreteRating.Explicit;
}

export function isRatingAllowed(rating: string, allowedRatings: Rating): boolean {
  return (decodeRating(rating) & allowedRatings) > 0;
}

export function filterByRating(favorites: Favorite[], allowedRatings: Rating): Favorite[] {
  return allowedRatings === ALL_RATINGS_VALUE ? favorites : favorites.filter(favorite => isRatingAllowed(favorite.post.rating, allowedRatings));
}
