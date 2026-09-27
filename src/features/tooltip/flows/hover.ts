import { EnhancedMouseEvent } from "@/lib/event/input";
import { TooltipFlow } from "@/features/tooltip/flows/flow";
import { getTagSetFromThumb } from "@/lib/ui/thumb/tag";

export class TooltipHoverFlow extends TooltipFlow {

  public handleMouseOver(event: EnhancedMouseEvent): void {
    if (!this.model.tooltipEnabled() || !this.context.featureBridge.galleryIdle()) {
      return;
    }

    if (event.thumb === null) {
      this.view.hide();
    } else {
      const tags = getTagSetFromThumb(event.thumb, (id) => this.context.featureBridge.favorites.favorite.request(id));

      this.view.show(event.thumb, tags, (tag) => this.model.colorForTag(tag));
    }
  }
}
