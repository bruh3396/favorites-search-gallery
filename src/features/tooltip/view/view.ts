import * as TooltipContent from "@/features/tooltip/view/content";
import * as TooltipPosition from "@/features/tooltip/view/position";
import { AppContext } from "@/app/context/context";
import { TooltipElement } from "@/features/tooltip/view/element";

export class TooltipView {
  private readonly element: TooltipElement;
  private lastThumb: HTMLElement | null = null;
  private lastTooltip: HTMLElement | null = null;

  constructor(context: AppContext) {
    this.element = new TooltipElement(context.shell);
  }

  public setup(): void {
    this.element.setup();
  }

  public show(thumb: HTMLElement, getColor: (tag: string) => string | null): void {
    const tooltip = this.element.reveal();

    this.lastThumb = thumb;
    this.lastTooltip = tooltip;
    TooltipContent.render(tooltip, thumb, getColor);
    TooltipPosition.position(tooltip, thumb);
  }

  public hide(): void {
    this.lastThumb = null;
    this.lastTooltip = null;
    this.element.hide();
  }

  public repositionIfVisible(): void {
    if (this.lastThumb !== null && this.lastTooltip !== null) {
      TooltipPosition.position(this.lastTooltip, this.lastThumb);
    }
  }
}
