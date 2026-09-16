import { PostOverlayFlow } from "@/features/post_overlay/flows/flow";

export class PostOverlayToggleFlow extends PostOverlayFlow {

  public setVisible(enabled: boolean): void {
    if (enabled) {
      this.flows.hover.showThumbUnderCursor();
    } else {
      this.flows.hover.hideOverlay();
    }
  }
}
