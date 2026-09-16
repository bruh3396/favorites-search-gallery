import { TooltipFlow } from "@/features/tooltip/flows/flow";

export class TooltipToggleFlow extends TooltipFlow {

  public hideIfDisabled(value: boolean): void {
    if (!value) {
      this.view.hide();
    }
  }
}
