import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryThumbObserver from "@/features/gallery/control/visible_thumb_observer";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { GalleryConfig } from "@/config/gallery_config";
import { debounceLeading } from "@/lib/async/debounce";
import { dispatchByState } from "@/features/gallery/flows/state_dispatch";
import { getAllContentThumbs } from "@/app/layout/content_thumbs";

export function handlePageChange(): void {
  indexThumbs();
  refreshContentDebounced();
}

const refreshContentDebounced = debounceLeading(() => {
  dispatchByState({
    idle: outOfGalleryPageChange,
    preview: outOfGalleryPageChange,
    open: GalleryView.softReset
  });
}, GalleryConfig.preloadMediaDebounceTime);

function outOfGalleryPageChange(): void {
  GalleryView.reset();
  cacheAroundFirstThumb();
}

function cacheAroundFirstThumb(): void {
  if (!GalleryConfig.cacheFirstImages) {
    return;
  }
  const [firstThumb] = getAllContentThumbs();

  if (firstThumb !== undefined) {
    GalleryView.cacheImages(GalleryModel.getThumbsAround(firstThumb));
  }
}

export function indexThumbs(): void {
  GalleryThumbObserver.resetCenterThumb();
  GalleryThumbObserver.observeAllThumbsOnPage();
  GalleryModel.reIndexThumbs();
}

export function handleNewContent(elements: HTMLElement[]): void {
  GalleryThumbObserver.observe(elements);
  GalleryModel.reIndexThumbs();
}
