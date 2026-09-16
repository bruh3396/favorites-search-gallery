import { TooltipFlow } from "@/features/tooltip/flows/flow";

export class TooltipScrollFlow extends TooltipFlow {

  public reposition(): void {
    if (this.model.tooltipEnabled()) {
      this.view.repositionIfVisible();
    }
  }
}
