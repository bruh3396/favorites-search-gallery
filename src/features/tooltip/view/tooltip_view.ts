import * as TooltipContent from "./tooltip_content";
import * as TooltipElement from "./shell/tooltip_element";
import * as TooltipPosition from "./tooltip_position";
import * as TooltipVisibility from "./tooltip_visibility";

let lastThumb: HTMLElement | null = null;

export function setup(): void {
  TooltipElement.setupTooltipShell();
}

export function showTooltipForThumb(thumb: HTMLElement, getColor: (tag: string) => string | null): void {
  lastThumb = thumb;
  TooltipContent.renderTooltipContent(thumb, getColor);
  TooltipPosition.positionTooltip(thumb);
  TooltipVisibility.showTooltip();
}

export function hideTooltip(): void {
  lastThumb = null;
  TooltipVisibility.hideTooltip();
}

export function repositionIfVisible(): void {
  if (lastThumb === null) {
    return;
  }
  TooltipPosition.positionTooltip(lastThumb);
}
