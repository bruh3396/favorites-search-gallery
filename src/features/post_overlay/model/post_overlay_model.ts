import * as PostOverlayCategoryResolver from "@/features/post_overlay/model/providers/tags/category_resolver";
import { TagCategory } from "@/types/search";

export function setup(): void {
  PostOverlayCategoryResolver.preloadCache();
}

export function resolveTagCategories(thumb: HTMLElement): Promise<Map<string, TagCategory>> {
  return PostOverlayCategoryResolver.resolveAll(thumb);
}

export { isCurrent as isCurrentTarget, setCurrent as setCurrentTarget, clear as clearOverlayTarget } from "@/features/post_overlay/model/state/overlay_target";
export { record as recordCursorPosition, thumbUnderCursor } from "@/features/post_overlay/model/state/cursor_tracker";
export { isCoolingDown, start as startReopenCooldown } from "@/features/post_overlay/model/state/reopen_cooldown";
