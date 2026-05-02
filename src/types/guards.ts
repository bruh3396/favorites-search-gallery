import { ExitKey, ForwardNavigationKey, NavigationKey } from "./input";
import { MetadataComparator, SearchableMetadataMetric, TagCategory } from "./search";

export const exitKeys: Set<ExitKey> = new Set(["Escape", "Delete", "Backspace"]);
export const navigationKeys: Set<NavigationKey> = new Set(["a", "A", "ArrowLeft", "d", "D", "ArrowRight"]);
export const forwardNavigationKeys: Set<ForwardNavigationKey> = new Set(["d", "D", "ArrowRight"]);
export const metadataComparators: Set<MetadataComparator> = new Set([":", ":<", ":>"]);
export const searchableMetadataMetrics: Set<SearchableMetadataMetric> = new Set(["score", "width", "height", "id", "duration"]);
export const tagCategories: Set<TagCategory> = new Set(["general", "artist", "unknown", "copyright", "character", "metadata"]);
export const typeableInputs = new Set(["color", "email", "number", "password", "search", "tel", "text", "url", "datetime"]);

export function isExitKey(value: unknown): value is ExitKey {
  return exitKeys.has(value as ExitKey);
}

export function isNavigationKey(value: unknown): value is NavigationKey {
  return navigationKeys.has(value as NavigationKey);
}

export function isForwardNavigationKey(value: NavigationKey): boolean {
  return forwardNavigationKeys.has(value as ForwardNavigationKey);
}

export function isSearchableMetadataMetric(value: unknown): value is SearchableMetadataMetric {
  return searchableMetadataMetrics.has(value as SearchableMetadataMetric);
}

export function isMetadataComparator(value: unknown): value is MetadataComparator {
  return metadataComparators.has(value as MetadataComparator);
}

export function isTagCategory(value: unknown): value is TagCategory {
  return tagCategories.has(value as TagCategory);
}
