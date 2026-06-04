import * as TooltipView from "@/features/tooltip/view/tooltip_view";

export function onTooltipToggled(value: boolean): void {
  if (!value) {
    TooltipView.hideTooltip();
  }
}
