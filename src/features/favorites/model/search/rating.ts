import { DiscreteRating, Rating } from "@/types/search";
import { ALL_RATINGS_VALUE } from "@/lib/constants";
import { Favorite } from "@/types/favorite";

const RATINGS_BY_INITIAL: Record<string, Rating> = {
  e: DiscreteRating.Explicit,
  q: DiscreteRating.Questionable,
  s: DiscreteRating.Safe
};

export function toRatingValue(rating: string): Rating {
  return RATINGS_BY_INITIAL[rating.charAt(0).toLowerCase()] ?? DiscreteRating.Explicit;
}

export function toRatingString(rating: Rating): string {
  switch (rating) {
    case DiscreteRating.Safe:
      return "s";
    case DiscreteRating.Questionable:
      return "q";
    default:
      return "e";
  }
}

export function isRatingAllowed(rating: string | Rating, allowedRatings: Rating): boolean {
  const decoded = typeof rating === "string" ? toRatingValue(rating) : rating;
  return (decoded & allowedRatings) > 0;
}

export function filterByRating(favorites: Favorite[], allowedRatings: Rating): Favorite[] {
  return allowedRatings === ALL_RATINGS_VALUE ? favorites : favorites.filter(favorite => isRatingAllowed(favorite.post.rating, allowedRatings));
}
