import { AutoplayConfiguration } from "@/features/gallery/features/autoplay/types/types";
import { AutoplayFlowDependencies } from "@/features/gallery/features/autoplay/flows/flow";
import { AutoplayMenuFlow } from "@/features/gallery/features/autoplay/flows/menu";
import { AutoplayPlayerFlow } from "@/features/gallery/features/autoplay/flows/player";

export class AutoplayFlows {
  public readonly player: AutoplayPlayerFlow;
  public readonly menu: AutoplayMenuFlow;

  constructor(configuration: AutoplayConfiguration, dependencies: Omit<AutoplayFlowDependencies, "flows">) {
    const flowDependencies: AutoplayFlowDependencies = { ...dependencies, flows: this };

    this.player = new AutoplayPlayerFlow(configuration, flowDependencies);
    this.menu = new AutoplayMenuFlow(configuration, flowDependencies);
  }
}
