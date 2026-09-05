import * as TooltipModel from "@/features/tooltip/model/model";
import * as TooltipView from "@/features/tooltip/view/view";
import { EnhancedMouseEvent } from "@/lib/input";
import { galleryIdle } from "@/app/channels/feature_bridge";

export function handleMouseOver(event: EnhancedMouseEvent): void {
  if (!TooltipModel.tooltipEnabled() || !galleryIdle()) {
    return;
  }

  if (event.thumb === null) {
    TooltipView.hide();
  } else {
    TooltipView.show(event.thumb, TooltipModel.colorForTag);
  }
}
