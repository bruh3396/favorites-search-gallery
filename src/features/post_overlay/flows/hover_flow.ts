import * as PostOverlayModeDispatch from "./mode_dispatch";
import * as PostOverlayModel from "../model/post_overlay_model";
import * as PostOverlayView from "../view/post_overlay_view";
import { EnhancedMouseEvent } from "../../../types/input";
import { Preferences } from "../../../app/context/preferences";
import { isInsideOverlay } from "../dom_tweaks/overlay_hit_test";

export function onMouseover(event: EnhancedMouseEvent): void {
  if (!Preferences.postOverlayEnabled.value) {
    return;
  }
  PostOverlayModel.recordCursorPosition(event);

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

function showThumbUnderCursor(): void {
  if (!Preferences.postOverlayEnabled.value) {
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
