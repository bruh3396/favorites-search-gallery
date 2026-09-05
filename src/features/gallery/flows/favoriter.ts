import * as GalleryModel from "@/features/gallery/model/model";
import * as GalleryView from "@/features/gallery/view/view";
import { Events } from "@/app/channels/events";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { vibrate } from "@/utils/browser/haptics";

export async function addFavoriteInGallery(): Promise<void> {
  const status = await GalleryModel.addFavorite();

  if (status === "success") {
    Events.app.favoriteAdded.emit(GalleryModel.currentThumb().id);

    if (ON_MOBILE_DEVICE) {
      vibrate(15);
    }
  }
  GalleryView.showAddedFavoriteStatus(status);
}

export async function removeFavoriteInGallery(): Promise<void> {
  const status = await GalleryModel.removeFavorite();

  if (status === "success") {
    Events.app.favoriteRemoved.emit(GalleryModel.currentThumb().id);
  }
  GalleryView.showRemovedFavoriteStatus(status);
}
