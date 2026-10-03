import { AutoplayConfiguration, AutoplayDependencies } from "@/features/gallery/features/autoplay/types/types";
import { AutoplayFlows } from "@/features/gallery/features/autoplay/flows/flows";
import { AutoplayModel } from "@/features/gallery/features/autoplay/model/model";
import { AutoplayView } from "@/features/gallery/features/autoplay/view/view";

export interface AutoplayFlowDependencies {
  context: AutoplayDependencies;
  model: AutoplayModel;
  view: AutoplayView;
  flows: AutoplayFlows;
}

export abstract class AutoplayFlow {
  protected readonly configuration: AutoplayConfiguration;
  protected readonly context: AutoplayDependencies;
  protected readonly model: AutoplayModel;
  protected readonly view: AutoplayView;
  protected readonly flows: AutoplayFlows;

  constructor(configuration: AutoplayConfiguration, dependencies: AutoplayFlowDependencies) {
    this.configuration = configuration;
    this.context = dependencies.context;
    this.model = dependencies.model;
    this.view = dependencies.view;
    this.flows = dependencies.flows;
  }
}
