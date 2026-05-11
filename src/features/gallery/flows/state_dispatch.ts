import * as GalleryModel from "../model/gallery_model";
import { GalleryState } from "../types/gallery_types";

type GalleryStateHandlers<V> = {
  idle?: (arg: V) => void
  hover?: (arg: V) => void
  open?: (arg: V) => void
};

export function dispatchByState<V>(handlers: GalleryStateHandlers<V>, args?: V): void {
  const handler = {
    [GalleryState.Idle]: handlers.idle,
    [GalleryState.Hover]: handlers.hover,
    [GalleryState.Open]: handlers.open
  }[GalleryModel.getCurrentState()];

  handler?.(args as V);
}
