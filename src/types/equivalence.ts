import { ExitKey, ForwardNavigationKey, MetadataComparator, NavigationKey, SearchableMetadataMetric, TagCategory } from "./common_types";

export const EXIT_KEYS: Set<ExitKey> = new Set(["Escape", "Delete", "Backspace"]);
export const NAVIGATION_KEYS: Set<NavigationKey> = new Set(["a", "A", "ArrowLeft", "d", "D", "ArrowRight"]);
export const FORWARD_NAVIGATION_KEYS: Set<ForwardNavigationKey> = new Set(["d", "D", "ArrowRight"]);
export const METADATA_COMPARATORS: Set<MetadataComparator> = new Set([":", ":<", ":>"]);
export const SEARCHABLE_METADATA_METRICS: Set<SearchableMetadataMetric> = new Set(["score", "width", "height", "id", "duration"]);
export const TAG_CATEGORIES: Set<TagCategory> = new Set(["general", "artist", "unknown", "copyright", "character", "metadata"]);

export function isExitKey(value: unknown): value is ExitKey {
  return EXIT_KEYS.has(value as ExitKey);
}

export function isNavigationKey(value: unknown): value is NavigationKey {
  return NAVIGATION_KEYS.has(value as NavigationKey);
}

export function isForwardNavigationKey(value: NavigationKey): boolean {
  return FORWARD_NAVIGATION_KEYS.has(value as ForwardNavigationKey);
}

export function isSearchableMetadataMetric(value: unknown): value is SearchableMetadataMetric {
  return SEARCHABLE_METADATA_METRICS.has(value as SearchableMetadataMetric);
}

export function isMetadataComparator(value: unknown): value is MetadataComparator {
  return METADATA_COMPARATORS.has(value as MetadataComparator);
}

export function isTagCategory(value: unknown): value is TagCategory {
  return TAG_CATEGORIES.has(value as TagCategory);
}
