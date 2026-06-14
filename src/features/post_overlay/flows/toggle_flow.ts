import * as PostOverlayHoverFlow from "@/features/post_overlay/flows/hover_flow";

export function onToggled(enabled: boolean): void {
  if (enabled) {
    PostOverlayHoverFlow.showThumbUnderCursor();
  } else {
    PostOverlayHoverFlow.hideOverlay();
  }
}
