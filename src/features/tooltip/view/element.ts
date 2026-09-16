import { ElementPool } from "@/lib/ui/element_pool";
import { Shell } from "@/app/context/shell";
import TOOLTIP_CSS from "@/assets/css/tooltip.css";
import { div } from "@/utils/browser/element";
import { insertStyle } from "@/utils/browser/injector";

const TOOLTIP_POOL_SIZE = 3;

export class TooltipElement {
  private readonly pool = new ElementPool(TOOLTIP_POOL_SIZE, createTooltipElement);

  constructor(private readonly shell: Shell) { }

  public setup(): void {
    insertStyle(TOOLTIP_CSS, "tooltip-style");
    this.pool.all.forEach(element => this.shell.overlays.appendChild(element));
  }

  public reveal(): HTMLElement {
    return this.pool.reveal();
  }

  public hide(): void {
    this.pool.hide();
  }
}

function createTooltipElement(): HTMLDivElement {
  const el = div();

  el.className = "tooltip";
  return el;
}
