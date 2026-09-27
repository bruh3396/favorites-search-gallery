import * as TooltipPosition from "@/features/tooltip/view/position";

interface Placed {
  tooltip: HTMLElement;
  thumb: HTMLElement;
}

export class TooltipPlacement {
  private placed: Placed | null = null;

  public setup(getTopObstruction: () => HTMLElement | null): void {
    this.getTopObstruction = getTopObstruction;
  }

  public place(tooltip: HTMLElement, thumb: HTMLElement): void {
    this.placed = { tooltip, thumb };
    TooltipPosition.position(tooltip, thumb, this.getTopObstruction());
  }

  public clear(): void {
    this.placed = null;
  }

  public reposition(): void {
    if (this.placed !== null) {
      TooltipPosition.position(this.placed.tooltip, this.placed.thumb, this.getTopObstruction());
    }
  }

  private getTopObstruction: () => HTMLElement | null = () => null;
}
