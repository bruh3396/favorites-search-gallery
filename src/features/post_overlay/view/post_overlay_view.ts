import * as PostOverlayShell from "@/features/post_overlay/view/shell/post_overlay_shell";
import * as PostOverlayTagRenderer from "@/features/post_overlay/view/rendering/tag_renderer";
import { TagCategory } from "@/types/search";

export function setup(): void {
  PostOverlayShell.setup();
}

export function renderTags(postId: string, categories: Map<string, TagCategory>): void {
  PostOverlayTagRenderer.renderTags(PostOverlayShell.getOverlay(), postId, categories);
}

export { reveal, hide } from "@/features/post_overlay/view/shell/post_overlay_shell";
