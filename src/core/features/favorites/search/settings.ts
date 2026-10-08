import { METRICS } from "@/core/domain/post/post";

export const SORT_KEYS = ["favorited", "random", ...METRICS] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export interface SearchSettings {
  query: string;
  isInverted: boolean;
  sortKey: SortKey;
  isSortAscending: boolean;
  allowedRatings: number;
  isBlacklistEnabled: boolean;
  isShuffled: boolean;
  shuffleSeed: number;
}
