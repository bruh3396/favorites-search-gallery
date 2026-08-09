import * as TooltipModel from "@/features/tooltip/model/tooltip_model";
import * as TooltipView from "@/features/tooltip/view/tooltip_view";
import { EnhancedMouseEvent } from "@/types/input";
import { galleryIdle } from "@/app/channels/feature_bridge";

export function onMouseover(event: EnhancedMouseEvent): void {
  if (!TooltipModel.tooltipEnabled() || !galleryIdle()) {
    return;
  }

  if (event.thumb === null) {
    TooltipView.hide();
  } else {
    TooltipView.showTooltipForThumb(event.thumb, TooltipModel.getColorForTag);
  }
}
