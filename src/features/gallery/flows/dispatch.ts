import { GalleryFlow } from "@/features/gallery/flows/flow";

type GalleryStateHandlers<V> = {
  idle?: (arg: V) => void;
  preview?: (arg: V) => void;
  open?: (arg: V) => void;
};

export class GalleryDispatchFlow extends GalleryFlow {
  public run<V>(handlers: GalleryStateHandlers<V>, args?: V): void {
    const handler = {
      idle: handlers.idle,
      preview: handlers.preview,
      open: handlers.open
    }[this.model.getCurrentState()];

    handler?.(args as V);
  }
}
