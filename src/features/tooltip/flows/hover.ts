import { EnhancedMouseEvent } from "@/lib/event/input";
import { TooltipFlow } from "@/features/tooltip/flows/flow";

export class TooltipHoverFlow extends TooltipFlow {

  public handleMouseOver(event: EnhancedMouseEvent): void {
    if (!this.model.tooltipEnabled() || !this.context.featureBridge.galleryIdle()) {
      return;
    }

    if (event.thumb === null) {
      this.view.hide();
    } else {
      this.view.show(event.thumb, (tag) => this.model.colorForTag(tag));
    }
  }
}
