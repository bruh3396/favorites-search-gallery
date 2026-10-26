import { METRICS } from "@/core/domain/post/metric";

export const FAVORITES_SORT_KEYS = ["favorited", "random", ...METRICS] as const;

export type FavoritesSortKey = (typeof FAVORITES_SORT_KEYS)[number];
