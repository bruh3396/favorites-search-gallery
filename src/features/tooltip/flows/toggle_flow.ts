import * as TooltipView from "../view/tooltip_view";

export function onTooltipToggled(value: boolean): void {
  if (!value) {
    TooltipView.hideTooltip();
  }
}
