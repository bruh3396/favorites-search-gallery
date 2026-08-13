import * as TooltipModel from "@/features/tooltip/model/tooltip_model";
import * as TooltipView from "@/features/tooltip/view/tooltip_view";
import { EnhancedMouseEvent } from "@/lib/input/mouse_event";
import { galleryIdle } from "@/app/channels/feature_bridge";

export function handleMouseOver(event: EnhancedMouseEvent): void {
  if (!TooltipModel.tooltipEnabled() || !galleryIdle()) {
    return;
  }

  if (event.thumb === null) {
    TooltipView.hide();
  } else {
    TooltipView.showTooltipForThumb(event.thumb, TooltipModel.getColorForTag);
  }
}
