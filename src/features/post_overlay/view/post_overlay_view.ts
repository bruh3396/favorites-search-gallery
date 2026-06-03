import * as PostOverlayShell from "./shell/post_overlay_shell";
import * as PostOverlayTagRenderer from "./rendering/tag_renderer";
import { TagCategory } from "../../../types/search";

export function setup(): void {
  PostOverlayShell.setup();
}

export function renderTags(postId: string, categories: Map<string, TagCategory>): void {
  PostOverlayTagRenderer.renderTags(PostOverlayShell.getOverlay(), postId, categories);
}

export function showForThumb(thumb: HTMLElement): void {
  const overlay = PostOverlayShell.getOverlay();
  const rect = thumb.getBoundingClientRect();

  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.dataset.visible = "true";
}

export function hide(): void {
  PostOverlayShell.getOverlay().dataset.visible = "false";
}
