import * as GalleryModel from "../../../model/gallery_model";
import { GalleryState } from "../../../types/gallery_types";

type GalleryStateExecutors<V> = {
  idle?: (argument: V) => void;
  hover?: (argument: V) => void;
  gallery?: (argument: V) => void;
};

export function executeFunctionBasedOnGalleryState<V>(executors: GalleryStateExecutors<V>, args?: V): void {
  const executor = {
    [GalleryState.IDLE]: executors.idle,
    [GalleryState.SHOWING_CONTENT_ON_HOVER]: executors.hover,
    [GalleryState.IN_GALLERY]: executors.gallery
  }[GalleryModel.getCurrentState()];

  if (executor) {
    executor(args as V);
  }
}
