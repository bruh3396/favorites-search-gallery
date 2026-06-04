import * as PostOverlayCategoryResolver from "@/features/post_overlay/model/providers/tags/resolver";
import { TagCategoryMap } from "@/types/search";

export function setup(): void {
  PostOverlayCategoryResolver.preloadCache();
}

export function resolveTagCategories(thumb: HTMLElement): Promise<TagCategoryMap> {
  return PostOverlayCategoryResolver.resolveAll(thumb);
}

export function warmTagCategoryCache(categoryMap: TagCategoryMap): void {
  PostOverlayCategoryResolver.warmCache(categoryMap);
}

export { destroyStore } from "@/features/post_overlay/model/providers/tags/resolver";
export { isCurrent as isCurrentTarget, setCurrent as setCurrentTarget, clear as clearOverlayTarget } from "@/features/post_overlay/model/state/overlay_target";
export { record as recordCursorPosition, thumbUnderCursor } from "@/features/post_overlay/model/state/cursor_tracker";
export { isCoolingDown, start as startReopenCooldown } from "@/features/post_overlay/model/state/reopen_cooldown";
