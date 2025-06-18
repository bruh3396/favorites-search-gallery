import { ExitKey, ForwardNavigationKey, MetadataComparator, NavigationKey, SearchableMetadataMetric, TagCategory } from "./primitives";

export const FORWARD_NAVIGATION_KEYS: Set<ForwardNavigationKey> = new Set(["d", "D", "ArrowRight"]);
export const NAVIGATION_KEYS: Set<NavigationKey> = new Set(["a", "A", "ArrowLeft", "d", "D", "ArrowRight"]);
export const EXIT_KEYS: Set<ExitKey> = new Set(["Escape", "Delete", "Backspace"]);

export function isExitKey(value: unknown): value is ExitKey {
  return EXIT_KEYS.has(value as ExitKey);
}

export function isNavigationKey(value: unknown): value is NavigationKey {
  return NAVIGATION_KEYS.has(value as NavigationKey);
}

export function isForwardNavigationKey(key: NavigationKey): boolean {
  return FORWARD_NAVIGATION_KEYS.has(key as ForwardNavigationKey);
}

export function isSearchableMetadataMetric(value: unknown): value is SearchableMetadataMetric {
  return value === "score" || value === "width" || value === "height" || value === "id";
}

export function isMetadataComparator(value: unknown): value is MetadataComparator {
  return value === ":" || value === ":<" || value === ":>";
}

export function isTagCategory(value: unknown): value is TagCategory {
  return value === "general" || value === "artist" || value === "unknown" || value === "copyright" || value === "character" || value === "metadata";
}
