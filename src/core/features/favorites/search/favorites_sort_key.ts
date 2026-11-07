import { METRICS } from "@/core/domain/search/metric";

export const FAVORITES_SORT_KEYS = ["favorited", ...METRICS, "random"] as const;

export type FavoritesSortKey = (typeof FAVORITES_SORT_KEYS)[number];
