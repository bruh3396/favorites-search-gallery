import * as PostOverlayShell from "@/features/post_overlay/view/shell/post_overlay_shell";
import * as PostOverlayTagRenderer from "@/features/post_overlay/view/rendering/tag_renderer";
import { TagCategoryMap } from "@/types/search";

export function setup(): void {
  PostOverlayShell.setup();
}

export function renderTags(postId: string, categoryMap: TagCategoryMap): void {
  PostOverlayTagRenderer.renderTags(PostOverlayShell.getOverlay(), postId, categoryMap);
}

export { reveal, hide } from "@/features/post_overlay/view/shell/post_overlay_shell";
