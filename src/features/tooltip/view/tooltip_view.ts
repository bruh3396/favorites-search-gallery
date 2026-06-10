import * as TooltipContent from "@/features/tooltip/view/content";
import * as TooltipElement from "@/features/tooltip/view/shell/element";
import * as TooltipPosition from "@/features/tooltip/view/position";
import * as TooltipVisibility from "@/features/tooltip/view/visibility";

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
