import { clamp } from "@/utils/pure/number";

const TOP_MARGIN = 100;

export function position(tooltip: HTMLElement, thumb: HTMLElement): void {
  const rect = thumb.getBoundingClientRect();
  const width = tooltip.offsetWidth;
  const height = tooltip.offsetHeight;
  const topBoundary = Math.max(TOP_MARGIN, getMenuBottom());
  const overflowsRight = rect.right + width > window.innerWidth;
  const overflowsTop = rect.top < topBoundary;
  const overflowsBottom = rect.top + height > window.innerHeight;
  const isFlippedVertically = overflowsTop || overflowsBottom;
  const preferredLeft = isFlippedVertically ? rect.left : (overflowsRight ? rect.left - width : rect.right);
  const preferredTop = overflowsTop ? rect.bottom : (overflowsBottom ? rect.top - height : rect.top);
  const clampedLeft = clamp(preferredLeft, 0, window.innerWidth - width);
  const clampedTop = clamp(preferredTop, topBoundary, window.innerHeight - height);

  tooltip.style.left = `${clampedLeft + window.scrollX}px`;
  tooltip.style.top = `${clampedTop + window.scrollY}px`;
}

function getMenuBottom(): number {
  const menu = document.getElementById("favorites-toolbar");
  return (menu === null || menu.offsetParent === null) ? 0 : menu.getBoundingClientRect().bottom;
}
