import * as GalleryDispatch from "@/features/gallery/flows/dispatch";
import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryThumbObserver from "@/features/gallery/control/thumb_observer";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { Favorite } from "@/types/favorite";
import { GalleryConfig } from "@/config/gallery_config";
import { debounceLeading } from "@/lib/async/debounce";
import { getAllContentThumbs } from "@/app/layout/content_thumbs";

export function refresh(): void {
  reIndex();
  recache();
}

export function downscaleThumbsOutsideResults(searchResults: Favorite[]): void {
  GalleryView.downscaleAll(new Set(searchResults.map(favorite => favorite.id)));
}

export function reIndex(): void {
  GalleryThumbObserver.refresh();
  GalleryModel.indexThumbs();
}

const recache = debounceLeading(() => {
  GalleryDispatch.run({
    idle: recacheFirstThumbs,
    preview: recacheFirstThumbs,
    open: GalleryView.reupscaleCachedThumbs
  });
}, GalleryConfig.contentRefreshTime);

function recacheFirstThumbs(): void {
  GalleryView.cacheImages(getAllContentThumbs().slice(0, 25));
}
