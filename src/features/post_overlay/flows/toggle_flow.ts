import * as PostOverlayHoverFlow from "@/features/post_overlay/flows/hover_flow";

export function setVisible(enabled: boolean): void {
  if (enabled) {
    PostOverlayHoverFlow.showThumbUnderCursor();
  } else {
    PostOverlayHoverFlow.hideOverlay();
  }
}
