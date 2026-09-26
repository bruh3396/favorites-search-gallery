import { SearchableMetric } from "@/types/search";

export const searchableMetrics: ReadonlySet<SearchableMetric> = new Set(["score", "width", "height", "id", "duration"]);

export const isSearchableMetadataMetric = (value: unknown): value is SearchableMetric => searchableMetrics.has(value as SearchableMetric);
