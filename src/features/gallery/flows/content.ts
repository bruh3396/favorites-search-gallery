import * as GalleryControl from "@/features/gallery/control/control";
import * as GalleryFlows from "@/features/gallery/flows/flows";
import * as GalleryModel from "@/features/gallery/model/model";
import * as GalleryView from "@/features/gallery/view/view";
import { Favorite } from "@/types/favorite";
import { GalleryConfig } from "@/config/gallery_config";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { debounceLeading } from "@/lib/async/rate_limiting";
import { getAllContentThumbs } from "@/app/layout/content_thumbs";
import { queueMacroTask } from "@/lib/async/scheduling";

export function refresh(): void {
  reIndex();
  recache();
}

export function downscaleThumbsOutsideResults(searchResults: Favorite[]): void {
  queueMacroTask(() => GalleryView.downscaleAll(new Set(searchResults.map(favorite => favorite.id))));
}

function reIndex(): void {
  GalleryControl.refreshThumbObserver();
  GalleryModel.indexThumbs(getAllContentThumbs());
}

const recache = debounceLeading(() => {
  GalleryFlows.Dispatch.run({
    idle: recacheFirstThumbs,
    preview: recacheFirstThumbs,
    open: GalleryView.reupscaleCachedThumbs
  });
}, GalleryConfig.contentRefreshTime);

function recacheFirstThumbs(): void {
  if (ON_DESKTOP_DEVICE) {
    GalleryView.cacheImages(getAllContentThumbs().slice(0, 25));
  }
}
