import * as TooltipView from "@/features/tooltip/view/view";

export function hideIfDisabled(value: boolean): void {
  if (!value) {
    TooltipView.hide();
  }
}
