import * as TooltipModel from "../model/tooltip_model";
import * as TooltipView from "../view/tooltip_view";
import { EnhancedMouseEvent } from "../../../types/input";

export function onMouseover(event: EnhancedMouseEvent): void {
  if (!TooltipModel.tooltipEnabled()) {
    return;
  }

  if (event.thumb === null) {
    TooltipView.hideTooltip();
  } else {
    TooltipView.showTooltipForThumb(event.thumb, TooltipModel.getColorForTag);
  }
}
