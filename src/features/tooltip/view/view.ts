import * as TooltipContent from "@/features/tooltip/view/content";
import * as TooltipElement from "@/features/tooltip/view/shell/element";
import * as TooltipPosition from "@/features/tooltip/view/position";

let lastThumb: HTMLElement | null = null;
let lastTooltip: HTMLElement | null = null;

export function setup(): void {
  TooltipElement.setup();
}

export function show(thumb: HTMLElement, getColor: (tag: string) => string | null): void {
  const tooltip = TooltipElement.reveal();

  lastThumb = thumb;
  lastTooltip = tooltip;
  TooltipContent.render(tooltip, thumb, getColor);
  TooltipPosition.position(tooltip, thumb);
}

export function hide(): void {
  lastThumb = null;
  lastTooltip = null;
  TooltipElement.hide();
}

export function repositionIfVisible(): void {
  if (lastThumb !== null && lastTooltip !== null) {
    TooltipPosition.position(lastTooltip, lastThumb);
  }
}
