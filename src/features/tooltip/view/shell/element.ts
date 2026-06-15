import { Overlays } from "@/app/layout/shell";
import TOOLTIP_CSS from "@/assets/css/tooltip.css";
import { div } from "@/utils/dom/element_factory";
import { insertStyle } from "@/utils/dom/injector";

export const element = createTooltipElement();

export function setupTooltipShell(): void {
  insertStyle(TOOLTIP_CSS, "tooltip-style");
  Overlays.appendChild(element);
}

function createTooltipElement(): HTMLDivElement {
  const el = div("tooltip");

  el.className = "surface-panel";
  return el;
}
