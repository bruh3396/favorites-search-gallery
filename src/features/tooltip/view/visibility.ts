import * as TooltipElement from "@/features/tooltip/view/shell/element";

export function showTooltip(): void {
  TooltipElement.element.style.opacity = "1";
}

export function hideTooltip(): void {
  TooltipElement.element.style.opacity = "0";
}
