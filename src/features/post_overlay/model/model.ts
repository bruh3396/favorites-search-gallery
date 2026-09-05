import * as PostOverlayTagsResolver from "@/features/post_overlay/model/tags/resolver";
import { TagCategoryMap } from "@/types/search";

export function resolveTagCategories(thumb: HTMLElement): Promise<TagCategoryMap> {
  return PostOverlayTagsResolver.resolveAll(thumb);
}

export function warmTagCategoryCache(categoryMap: TagCategoryMap): void {
  PostOverlayTagsResolver.warmCache(categoryMap);
}

export { preloadCache as preloadTagCategoryCache, getCachedCategory as getTagCategory } from "@/features/post_overlay/model/tags/resolver";
export { isCurrent as isCurrentTarget, setCurrent as setCurrentTarget, clear as clearOverlayTarget } from "@/features/post_overlay/model/state/overlay_target";
export { record as recordCursorPosition, thumbUnderCursor } from "@/features/post_overlay/model/state/cursor_tracker";
export { isCoolingDown, start as startReopenCooldown } from "@/features/post_overlay/model/state/reopen_cooldown";
export { isResizing, setResizing } from "@/features/post_overlay/model/state/resize_state";
