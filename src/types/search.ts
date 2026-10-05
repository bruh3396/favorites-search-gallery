import { Metric } from "@/core/domain/post/post";

export const RATING_MASKS = [1, 2, 3, 4, 5, 6, 7] as const;
export type RatingMask = (typeof RATING_MASKS)[number];
export const SORT_KEYS = ["default", "random", "id", "score", "width", "height", "changedAt", "duration"] as const satisfies readonly ("default" | "random" | Metric)[];
export type SortKey = (typeof SORT_KEYS)[number];

export enum RatingBit {
  Explicit = 4,
  Questionable = 2,
  Safe = 1
}

export const ALL_RATINGS = RatingBit.Explicit | RatingBit.Questionable | RatingBit.Safe;
