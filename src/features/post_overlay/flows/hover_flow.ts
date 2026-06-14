import * as PostOverlayModeDispatch from "@/features/post_overlay/flows/mode_dispatch";
import * as PostOverlayModel from "@/features/post_overlay/model/post_overlay_model";
import * as PostOverlayView from "@/features/post_overlay/view/post_overlay_view";
import { EnhancedMouseEvent } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
import { galleryIdle } from "@/app/channels/feature_bridge";
import { isInsideOverlay } from "@/features/post_overlay/dom_tweaks/overlay_hit_test";

export function onMouseover(event: EnhancedMouseEvent): void {
  PostOverlayModel.recordCursorPosition(event);

  if (!Preferences.postOverlay.enabled.value || !galleryIdle() || PostOverlayModel.isResizing()) {
    return;
  }

  if (PostOverlayModel.isCoolingDown() || isInsideOverlay(event.originalEvent.target)) {
    return;
  }

  if (!event.insideOfThumb || event.thumb === null) {
    hideOverlay();
    return;
  }
  showOverlay(event.thumb);
}

export function hideOverlay(): void {
  PostOverlayModel.clearOverlayTarget();
  PostOverlayView.hide();
}

export function onThumbsMoved(): void {
  hideOverlay();
  PostOverlayModel.startReopenCooldown(showThumbUnderCursor);
}

export function showThumbUnderCursor(): void {
  if (!Preferences.postOverlay.enabled.value) {
    return;
  }
  const thumb = PostOverlayModel.thumbUnderCursor();

  if (thumb !== null) {
    showOverlay(thumb);
  }
}

function showOverlay(thumb: HTMLElement): void {
  if (PostOverlayModel.isCurrentTarget(thumb.id)) {
    return;
  }
  PostOverlayModel.setCurrentTarget(thumb.id);
  PostOverlayModeDispatch.dispatchByMode<HTMLElement>({
    tag: showTags
  }, thumb);
}

async function showTags(thumb: HTMLElement): Promise<void> {
  const categories = await PostOverlayModel.resolveTagCategories(thumb);

  if (PostOverlayModel.isCurrentTarget(thumb.id)) {
    PostOverlayView.renderTags(thumb.id, categories);
    PostOverlayView.reveal(thumb);
  }
}
