export type TooltipPosition = "above" | "below" | "right";

export function addTooltip(element: HTMLElement, text: string, position: TooltipPosition = "above"): void {
  if (text === "") {
    delete element.dataset.tooltip;
    delete element.dataset.tooltipPos;
    return;
  }
  element.dataset.tooltip = text;
  element.dataset.tooltipPos = position;
}
