import { MetadataComparator, NavigationKey, SearchableMetadataMetric } from "./primitives";

export function isForwardNavigationKey(key: NavigationKey): boolean {
  return key === "d" || key === "D" || key === "ArrowRight";
}

export function isSearchableMetadataMetric(value: unknown): value is SearchableMetadataMetric {
  return value === "score" || value === "width" || value === "height" || value === "id";
}

export function isMetadataComparator(value: unknown): value is MetadataComparator {
  return value === ":" || value === ":<" || value === ":>";
}
