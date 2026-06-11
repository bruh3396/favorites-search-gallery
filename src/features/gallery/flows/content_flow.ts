import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryThumbObserver from "@/features/gallery/control/thumb_observer";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { GalleryConfig } from "@/config/gallery_config";
import { debounceLeading } from "@/lib/async/debounce";
import { dispatchByState } from "@/features/gallery/flows/state_dispatch";

export function refresh(): void {
  GalleryThumbObserver.refresh();
  GalleryModel.indexThumbs();
  recache();
}

const recache = debounceLeading(() => {
  dispatchByState({
    idle: recacheFirstThumbs,
    preview: recacheFirstThumbs,
    open: GalleryView.reupscaleCachedThumbs
  });
}, GalleryConfig.contentRefreshTime);

function recacheFirstThumbs(): void {
  GalleryView.clearCache();
  GalleryView.cacheImages(GalleryModel.getFirstThumbs());
}
