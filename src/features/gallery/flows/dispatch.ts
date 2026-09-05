import * as GalleryModel from "@/features/gallery/model/model";

type GalleryStateHandlers<V> = {
  idle?: (arg: V) => void;
  preview?: (arg: V) => void;
  open?: (arg: V) => void;
};

export function run<V>(handlers: GalleryStateHandlers<V>, args?: V): void {
  const handler = {
    idle: handlers.idle,
    preview: handlers.preview,
    open: handlers.open
  }[GalleryModel.getCurrentState()];

  handler?.(args as V);
}
