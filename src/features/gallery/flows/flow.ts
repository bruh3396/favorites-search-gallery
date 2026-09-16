import { AppContext } from "@/app/context/context";
import { GalleryControl } from "@/features/gallery/control/control";
import { GalleryFlows } from "@/features/gallery/flows/flows";
import { GalleryModel } from "@/features/gallery/model/model";
import { GalleryView } from "@/features/gallery/view/view";

export interface GalleryFlowDependencies {
  context: AppContext;
  model: GalleryModel;
  view: GalleryView;
  control: GalleryControl;
  flows: GalleryFlows;
}

export abstract class GalleryFlow {
  protected readonly context: AppContext;
  protected readonly model: GalleryModel;
  protected readonly view: GalleryView;
  protected readonly control: GalleryControl;
  protected readonly flows: GalleryFlows;

  constructor(dependencies: GalleryFlowDependencies) {
    this.context = dependencies.context;
    this.model = dependencies.model;
    this.view = dependencies.view;
    this.control = dependencies.control;
    this.flows = dependencies.flows;
  }
}
