import { RATINGS, Rating } from "@/core/domain/post/rating";

export type RatingMask = number;

export const ALL_RATINGS_MASK: RatingMask = (1 << RATINGS.length) - 1;

export function toRatingMask(rating: Rating): RatingMask {
  return 1 << RATINGS.indexOf(rating);
}

export function isRatingMask(value: unknown): value is RatingMask {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= ALL_RATINGS_MASK;
}
