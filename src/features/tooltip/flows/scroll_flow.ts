import * as TooltipModel from "../model/tooltip_model";
import * as TooltipView from "../view/tooltip_view";

export function onScroll(): void {
  if (TooltipModel.tooltipEnabled()) {
    TooltipView.repositionIfVisible();
  }
}
