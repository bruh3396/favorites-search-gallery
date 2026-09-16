import { AppContext } from "@/app/context/context";
import { TooltipFlows } from "@/features/tooltip/flows/flows";
import { TooltipModel } from "@/features/tooltip/model/model";
import { TooltipView } from "@/features/tooltip/view/view";

export interface TooltipFlowDependencies {
  context: AppContext;
  model: TooltipModel;
  view: TooltipView;
  flows: TooltipFlows;
}

export abstract class TooltipFlow {
  protected readonly context: AppContext;
  protected readonly model: TooltipModel;
  protected readonly view: TooltipView;
  protected readonly flows: TooltipFlows;

  constructor(dependencies: TooltipFlowDependencies) {
    this.context = dependencies.context;
    this.model = dependencies.model;
    this.view = dependencies.view;
    this.flows = dependencies.flows;
  }
}
