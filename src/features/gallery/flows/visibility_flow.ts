import * as GalleryDispatch from "@/features/gallery/flows/dispatch";
import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryThumbObserver from "@/features/gallery/control/thumb_observer";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { GalleryConfig } from "@/config/gallery_config";

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
  const thumbs = GalleryThumbObserver.getVisibleThumbs();

  if (thumbs.length > 0 && thumbs.length < GalleryConfig.maxVisibleThumbsBeforeStoppingPreload) {
    Promise.resolve().then(() => use(thumbs));
  }
}

export function onVisibleThumbsChanged(): void {
  GalleryDispatch.run({
    idle: () => withVisibleThumbs(cacheOrUpscale),
    preview: () => withVisibleThumbs(GalleryView.cacheImages)
  });
}

export function upscaleVisibleThumbsAround(thumb: HTMLElement): void {
  GalleryThumbObserver.setCenterThumb(thumb);
  withVisibleThumbs(cacheOrUpscale);
}

export function cacheVisibleThumbsAround(thumb: HTMLElement): void {
  GalleryThumbObserver.setCenterThumb(thumb);
  withVisibleThumbs(GalleryView.cacheImages);
}
