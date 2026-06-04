import * as TooltipElement from "@/features/tooltip/view/shell/tooltip_element";
import { clamp } from "@/utils/number";

const TOP_MARGIN = 100;

export function positionTooltip(thumb: HTMLElement): void {
  const rect = thumb.getBoundingClientRect();
  const width = TooltipElement.element.offsetWidth;
  const height = TooltipElement.element.offsetHeight;
  const topBoundary = Math.max(TOP_MARGIN, getMenuBottom());
  const overflowsRight = rect.right + width > window.innerWidth;
  const overflowsTop = rect.top < topBoundary;
  const overflowsBottom = rect.top + height > window.innerHeight;
  const flippedVertically = overflowsTop || overflowsBottom;
  const preferredLeft = flippedVertically ? rect.left : (overflowsRight ? rect.left - width : rect.right);
  const preferredTop = overflowsTop ? rect.bottom : (overflowsBottom ? rect.top - height : rect.top);
  const clampedLeft = clamp(preferredLeft, 0, window.innerWidth - width);
  const clampedTop = clamp(preferredTop, topBoundary, window.innerHeight - height);

  TooltipElement.element.style.left = `${clampedLeft + window.scrollX}px`;
  TooltipElement.element.style.top = `${clampedTop + window.scrollY}px`;
}

function getMenuBottom(): number {
  const menu = document.getElementById("favorites-search-gallery-menu");

  if (menu === null || menu.offsetParent === null) {
    return 0;
  }
  return menu.getBoundingClientRect().bottom;
}
