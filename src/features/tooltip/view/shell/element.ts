import { ElementPool } from "@/lib/ui/element_pool";
import { Overlays } from "@/app/layout/shell";
import TOOLTIP_CSS from "@/assets/css/tooltip.css";
import { div } from "@/utils/browser/element";
import { insertStyle } from "@/utils/browser/injector";

const TOOLTIP_POOL_SIZE = 3;
const pool = new ElementPool(TOOLTIP_POOL_SIZE, createTooltipElement);

export function setup(): void {
  insertStyle(TOOLTIP_CSS, "tooltip-style");

  for (const tooltip of pool.all) {
    Overlays.appendChild(tooltip);
  }
}

export function reveal(): HTMLElement {
  return pool.reveal();
}

export function hide(): void {
  pool.hide();
}

function createTooltipElement(): HTMLDivElement {
  const el = div();

  el.className = "tooltip";
  return el;
}
