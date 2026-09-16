import { AppContext } from "@/app/context/context";
import { TooltipFlowDependencies } from "@/features/tooltip/flows/flow";
import { TooltipHoverFlow } from "@/features/tooltip/flows/hover";
import { TooltipModel } from "@/features/tooltip/model/model";
import { TooltipScrollFlow } from "@/features/tooltip/flows/scroll";
import { TooltipToggleFlow } from "@/features/tooltip/flows/toggle";
import { TooltipView } from "@/features/tooltip/view/view";

export class TooltipFlows {
  public readonly hover: TooltipHoverFlow;
  public readonly scroll: TooltipScrollFlow;
  public readonly toggle: TooltipToggleFlow;

  constructor(context: AppContext, model: TooltipModel, view: TooltipView) {
    const dependencies: TooltipFlowDependencies = { context, model, view, flows: this };

    this.hover = new TooltipHoverFlow(dependencies);
    this.scroll = new TooltipScrollFlow(dependencies);
    this.toggle = new TooltipToggleFlow(dependencies);
  }
}
