import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryThumbObserver from "@/features/gallery/control/visible_thumb_observer";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { GalleryConfig } from "@/config/gallery_config";
import { dispatchByState } from "@/features/gallery/flows/state_dispatch";
import { yieldControl } from "@/lib/async/timing";

function cacheOrUpscale(thumbs: HTMLElement[]): void {
  if (GalleryConfig.cacheImagesOnIdle) {
    GalleryView.cacheImages(thumbs);
  } else {
    GalleryView.upscale(thumbs);
  }
}

async function withVisibleThumbs(use: (thumbs: HTMLElement[]) => void): Promise<void> {
  if (!GalleryConfig.preloadingEnabled || GalleryModel.hasRecentlyExitedGallery() || GalleryModel.isInGallery()) {
    return;
  }
  const thumbs = GalleryThumbObserver.getVisibleThumbs();

  if (thumbs.length > 0 && thumbs.length < GalleryConfig.maxVisibleThumbsBeforeStoppingPreload) {
    await yieldControl();
    use(thumbs);
  }
}

export function onVisibleThumbsChanged(): void {
  dispatchByState({
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
