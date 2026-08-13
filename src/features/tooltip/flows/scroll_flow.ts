import * as TooltipModel from "@/features/tooltip/model/tooltip_model";
import * as TooltipView from "@/features/tooltip/view/tooltip_view";

export function reposition(): void {
  if (TooltipModel.tooltipEnabled()) {
    TooltipView.repositionIfVisible();
  }
}
