import * as PostOverlayCategoryResolver from "./providers/tags/category_resolver";
import { OverlayMode } from "../types/overlay_mode";
import { TagCategory } from "../../../types/search";

let mode: OverlayMode = "tags";

export function setup(): void {
  PostOverlayCategoryResolver.preloadCache();
}

export function getMode(): OverlayMode {
  return mode;
}

export function setMode(value: OverlayMode): void {
  mode = value;
}

export function resolveTagCategories(tagNames: string[]): Promise<Map<string, TagCategory>> {
  return PostOverlayCategoryResolver.resolveCategories(tagNames);
}
