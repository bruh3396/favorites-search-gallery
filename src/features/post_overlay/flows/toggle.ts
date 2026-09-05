import * as PostOverlayFlows from "@/features/post_overlay/flows/flows";

export function setVisible(enabled: boolean): void {
  if (enabled) {
    PostOverlayFlows.Hover.showThumbUnderCursor();
  } else {
    PostOverlayFlows.Hover.hideOverlay();
  }
}
