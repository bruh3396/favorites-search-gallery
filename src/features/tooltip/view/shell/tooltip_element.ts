import { Overlays } from "../../../../app/layout/shell";
import TOOLTIP_CSS from "../../../../assets/css/tooltip.css";
import { insertStyle } from "../../../../utils/dom/injector";

export const element = createTooltipElement();

export function setupTooltipShell(): void {
  insertStyle(TOOLTIP_CSS, "tooltip-style");
  Overlays.appendChild(element);
}

function createTooltipElement(): HTMLDivElement {
  const el = document.createElement("div");

  el.id = "tooltip";
  el.className = "theme--light";
  return el;
}
