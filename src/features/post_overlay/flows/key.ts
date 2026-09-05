import * as PostOverlayFlows from "@/features/post_overlay/flows/flows";
import * as PostOverlayModel from "@/features/post_overlay/model/model";
import * as PostOverlayView from "@/features/post_overlay/view/view";
import { EnhancedKeyboardEvent } from "@/lib/input";
import { Preferences } from "@/app/context/preferences";

export function handleKeyDown(event: EnhancedKeyboardEvent): void {
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

export function handleKeyUp(event: EnhancedKeyboardEvent): void {
  if (!Preferences.postOverlay.enabled.value) {
    return;
  }

  if (event.key === "shift") {
    PostOverlayModel.setResizing(false);
    PostOverlayModel.clearOverlayTarget();
    PostOverlayFlows.Hover.showThumbUnderCursor();
  }
}
