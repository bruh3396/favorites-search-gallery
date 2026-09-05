import * as GalleryControl from "@/features/gallery/control/control";
import * as GalleryFlows from "@/features/gallery/flows/flows";
import * as GalleryModel from "@/features/gallery/model/model";
import * as GalleryView from "@/features/gallery/view/view";
import { GalleryConfig } from "@/config/gallery_config";

export function handleVisibleThumbsChanged(): void {
  GalleryFlows.Dispatch.run({
    idle: () => withVisibleThumbs(cacheOrUpscale),
    preview: () => withVisibleThumbs(GalleryView.cacheImages)
  });
}

export function upscaleVisibleThumbsAround(thumb: HTMLElement): void {
  GalleryControl.setCenterThumb(thumb);
  withVisibleThumbs(cacheOrUpscale);
}

export function cacheVisibleThumbsAround(thumb: HTMLElement): void {
  GalleryControl.setCenterThumb(thumb);
  withVisibleThumbs(GalleryView.cacheImages);
}

function cacheOrUpscale(thumbs: HTMLElement[]): void {
  if (GalleryConfig.cacheImagesOnIdle) {
    GalleryView.cacheImages(thumbs);
  } else {
    GalleryView.upscale(thumbs);
  }
}

function withVisibleThumbs(use: (thumbs: HTMLElement[]) => void): void {
  if (!GalleryConfig.preloadingEnabled || GalleryModel.isInGallery()) {
    return;
  }
  const thumbs = GalleryControl.getVisibleThumbs();

  if (thumbs.length > 0 && thumbs.length < GalleryConfig.maxVisibleThumbsBeforeStoppingPreload) {
    Promise.resolve().then(() => use(thumbs));
  }
}
