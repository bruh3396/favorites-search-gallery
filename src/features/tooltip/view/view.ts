import * as TooltipContent from "@/features/tooltip/view/content";
import { AppContext } from "@/app/context/context";
import { TooltipElement } from "@/features/tooltip/view/element";
import { TooltipPlacement } from "@/features/tooltip/view/placement";

export class TooltipView {
  private readonly element: TooltipElement;
  private readonly placement: TooltipPlacement;

  constructor(context: AppContext) {
    this.element = new TooltipElement(context.shell);
    this.placement = new TooltipPlacement();
  }

  public setup(getTopObstruction: () => HTMLElement | null): void {
    this.element.setup();
    this.placement.setup(getTopObstruction);
  }

  public show(thumb: HTMLElement, tags: Set<string>, getColor: (tag: string) => string | null): void {
    const tooltip = this.element.reveal();

    TooltipContent.render(tooltip, tags, getColor);
    this.placement.place(tooltip, thumb);
  }

  public hide(): void {
    this.placement.clear();
    this.element.hide();
  }

  public repositionIfVisible(): void {
    this.placement.reposition();
  }
}
