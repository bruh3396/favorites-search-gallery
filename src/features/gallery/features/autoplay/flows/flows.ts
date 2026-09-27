import { AutoplayDependencies } from "@/features/gallery/features/autoplay/types/types";
import { AutoplayFlowDependencies } from "@/features/gallery/features/autoplay/flows/flow";
import { AutoplayMenuFlow } from "@/features/gallery/features/autoplay/flows/menu";
import { AutoplayModel } from "@/features/gallery/features/autoplay/model/model";
import { AutoplayPlayerFlow } from "@/features/gallery/features/autoplay/flows/player";
import { AutoplayView } from "@/features/gallery/features/autoplay/view/view";

export class AutoplayFlows {
  public readonly player: AutoplayPlayerFlow;
  public readonly menu: AutoplayMenuFlow;

  constructor(context: AutoplayDependencies, model: AutoplayModel, view: AutoplayView) {
    const dependencies: AutoplayFlowDependencies = { context, model, view, flows: this };

    this.player = new AutoplayPlayerFlow(dependencies);
    this.menu = new AutoplayMenuFlow(dependencies);
  }
}
