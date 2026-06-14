import * as PostOverlayHoverFlow from "@/features/post_overlay/flows/hover_flow";
import * as PostOverlayModel from "@/features/post_overlay/model/post_overlay_model";
import * as PostOverlayView from "@/features/post_overlay/view/post_overlay_view";
import { EnhancedKeyboardEvent } from "@/types/input";
import { Preferences } from "@/app/context/preferences";

export function onKeyDown(event: EnhancedKeyboardEvent): void {
  if (!Preferences.postOverlay.enabled.value) {
    return;
  }

  if (event.key === "shift") {
    PostOverlayModel.setResizing(true);

    if (PostOverlayView.isVisible()) {
      PostOverlayView.hide();
    }
  }
}

export function onKeyUp(event: EnhancedKeyboardEvent): void {
  if (!Preferences.postOverlay.enabled.value) {
    return;
  }

  if (event.key === "shift") {
    PostOverlayModel.setResizing(false);
    PostOverlayModel.clearOverlayTarget();
    PostOverlayHoverFlow.showThumbUnderCursor();
  }
}
