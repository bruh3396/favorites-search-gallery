import * as PostOverlayShell from "./shell/post_overlay_shell";
import * as PostOverlayTagRenderer from "./rendering/tag_renderer";
import { TagCategory } from "../../../types/search";

export function setup(): void {
  PostOverlayShell.setup();
}

export function renderTags(postId: string, categories: Map<string, TagCategory>): void {
  PostOverlayTagRenderer.renderTags(PostOverlayShell.getOverlay(), postId, categories);
}

export { reveal, hide } from "./shell/post_overlay_shell";
