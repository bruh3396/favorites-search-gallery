import { AppContext } from "@/app/context/context";
import { GalleryControl } from "@/features/gallery/control/control";
import { GalleryFlows } from "@/features/gallery/flows/flows";
import { GalleryModel } from "@/features/gallery/model/model";
import { GalleryView } from "@/features/gallery/view/view";
import { MediaItem } from "@/core/domain/post/post";

export interface GalleryFlowDependencies {
  context: AppContext;
  model: GalleryModel;
  view: GalleryView;
  control: GalleryControl;
  flows: GalleryFlows;
}

type GalleryStateHandlers<V> = {
  idle?: (arg: V) => void;
  preview?: (arg: V) => void;
  open?: (arg: V) => void;
};

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

  protected runForState<V>(handlers: GalleryStateHandlers<V>, arg?: V): void {
    handlers[this.model.getCurrentState()]?.(arg as V);
  }

  protected usingColumnLayout(): boolean {
    return this.context.featureBridge.currentLayout() === "column";
  }

  protected itemFor(thumb: HTMLElement): MediaItem | undefined {
    return this.context.featureBridge.postMedia(thumb.id);
  }

  protected itemsFor(thumbs: HTMLElement[]): MediaItem[] {
    return thumbs.map(thumb => this.itemFor(thumb)).filter(item => item !== undefined);
  }
}
