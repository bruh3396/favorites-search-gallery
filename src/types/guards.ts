import { ExitKey, ForwardNavigationKey, NavigationKey, TypeableInput } from "@/types/input";
import { MetricComparator, SearchableMetric, TagCategory } from "@/types/search";

export const exitKeys: ReadonlySet<ExitKey> = new Set(["Escape", "Delete", "Backspace"]);
export const navigationKeys: ReadonlySet<NavigationKey> = new Set(["a", "A", "ArrowLeft", "d", "D", "ArrowRight"]);
export const forwardNavigationKeys: ReadonlySet<ForwardNavigationKey> = new Set(["d", "D", "ArrowRight"]);
export const metadataComparators: ReadonlySet<MetricComparator> = new Set([":", ":<", ":>"]);
export const searchableMetrics: ReadonlySet<SearchableMetric> = new Set(["score", "width", "height", "id", "duration"]);
export const tagCategories: ReadonlySet<TagCategory> = new Set(["general", "artist", "unknown", "copyright", "character", "metadata"]);
export const typeableInputs: ReadonlySet<TypeableInput> = new Set(["color", "email", "number", "password", "search", "tel", "text", "url", "datetime"]);

export const isExitKey = (value: unknown): value is ExitKey => exitKeys.has(value as ExitKey);
export const isNavigationKey = (value: unknown): value is NavigationKey => navigationKeys.has(value as NavigationKey);
export const isForwardNavigationKey = (value: NavigationKey): value is ForwardNavigationKey => forwardNavigationKeys.has(value as ForwardNavigationKey);
export const isSearchableMetadataMetric = (value: unknown): value is SearchableMetric => searchableMetrics.has(value as SearchableMetric);
export const isMetadataComparator = (value: unknown): value is MetricComparator => metadataComparators.has(value as MetricComparator);
export const isTagCategory = (value: unknown): value is TagCategory => tagCategories.has(value as TagCategory);
