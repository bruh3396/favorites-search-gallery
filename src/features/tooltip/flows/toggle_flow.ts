import * as TooltipView from "@/features/tooltip/view/tooltip_view";

export function hideIfDisabled(value: boolean): void {
  if (!value) {
    TooltipView.hide();
  }
}
