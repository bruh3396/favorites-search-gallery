import { ElementPool } from "@/lib/ui/element_pool";
import { Shell } from "@/app/context/shell";
import { div } from "@/utils/browser/element";

export class TooltipElement {
  private readonly pool = new ElementPool(3, createTooltipElement);

  constructor(private readonly shell: Shell) { }

  public setup(): void {
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
