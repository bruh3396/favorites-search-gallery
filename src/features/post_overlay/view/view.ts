import * as PostOverlayElement from "@/features/post_overlay/view/shell/element";
import * as PostOverlayTagRenderer from "@/features/post_overlay/view/rendering/tag_renderer";
import { TagCategoryMap } from "@/types/search";

export function setup(): void {
  PostOverlayElement.setup();
}

export function renderTags(postId: string, categoryMap: TagCategoryMap): void {
  PostOverlayTagRenderer.renderTags(PostOverlayElement.getOverlay(), postId, categoryMap);
}

export { reveal, hide, isVisible } from "@/features/post_overlay/view/shell/element";
