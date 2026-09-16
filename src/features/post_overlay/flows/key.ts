import { EnhancedKeyboardEvent } from "@/lib/event/input";
import { PostOverlayFlow } from "@/features/post_overlay/flows/flow";

export class PostOverlayKeyFlow extends PostOverlayFlow {

  public handleKeyDown(event: EnhancedKeyboardEvent): void {
    if (!this.context.preferences.postOverlay.enabled.value) {
      return;
    }

    if (event.key === "shift") {
      this.model.setResizing(true);

      if (this.view.isVisible()) {
        this.view.hide();
      }
    }
  }

  public handleKeyUp(event: EnhancedKeyboardEvent): void {
    if (!this.context.preferences.postOverlay.enabled.value) {
      return;
    }

    if (event.key === "shift") {
      this.model.setResizing(false);
      this.model.clearOverlayTarget();
      this.flows.hover.showThumbUnderCursor();
    }
  }
}
