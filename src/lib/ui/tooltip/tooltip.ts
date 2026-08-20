import { toggleDataset } from "@/utils/browser/dataset";

export type TooltipPosition = "above" | "below" | "right";

export function setTooltipsEnabled(enabled: boolean): void {
  toggleDataset(document.documentElement, "tooltips", enabled);
}

export function addTooltip(element: HTMLElement, text: string, position: TooltipPosition = "above", caret: boolean = true): void {
  if (text === "") {
    delete element.dataset.tooltip;
    delete element.dataset.tooltipPos;
    delete element.dataset.tooltipCaret;
    return;
  }
  element.dataset.tooltip = text;
  element.dataset.tooltipPos = position;
  toggleDataset(element, "tooltipCaret", caret);
}
