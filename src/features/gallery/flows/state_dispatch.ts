import * as GalleryModel from "@/features/gallery/model/gallery_model";
import { GalleryState } from "@/features/gallery/types/gallery_types";

type GalleryStateHandlers<V> = {
  idle?: (arg: V) => void
  preview?: (arg: V) => void
  open?: (arg: V) => void
};

export function dispatchByState<V>(handlers: GalleryStateHandlers<V>, args?: V): void {
  const handler = {
    [GalleryState.Idle]: handlers.idle,
    [GalleryState.Preview]: handlers.preview,
    [GalleryState.Open]: handlers.open
  }[GalleryModel.getCurrentState()];

  handler?.(args as V);
}
