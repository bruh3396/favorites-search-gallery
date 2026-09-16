import { AppContext } from "@/app/context/context";
import { TooltipFlows } from "@/features/tooltip/flows/flows";
import { TooltipModel } from "@/features/tooltip/model/model";
import { TooltipView } from "@/features/tooltip/view/view";

export interface TooltipComponents {
  context: AppContext;
  model: TooltipModel;
  view: TooltipView;
  flows: TooltipFlows;
}
