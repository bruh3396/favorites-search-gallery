import * as TooltipModel from "@/features/tooltip/model/model";
import * as TooltipView from "@/features/tooltip/view/view";

export function reposition(): void {
  if (TooltipModel.tooltipEnabled()) {
    TooltipView.repositionIfVisible();
  }
}
