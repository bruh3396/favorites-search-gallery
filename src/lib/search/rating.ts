import { DiscreteRating, Rating } from "@/types/search";

const RATINGS_BY_INITIAL: Record<string, Rating> = {
  e: DiscreteRating.Explicit,
  q: DiscreteRating.Questionable,
  s: DiscreteRating.Safe
};

export function decodeRating(rating: string): Rating {
  return RATINGS_BY_INITIAL[rating.charAt(0).toLowerCase()] ?? DiscreteRating.Explicit;
}
