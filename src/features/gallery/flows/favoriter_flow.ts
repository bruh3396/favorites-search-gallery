import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { Events } from "@/app/channels/events";

export async function addFavoriteInGallery(): Promise<void> {
  const status = await GalleryModel.addFavorite();

  if (status === "success") {
    Events.favorites.favoriteAdded.emit(GalleryModel.currentThumb().id);
  }
  GalleryView.showAddedFavoriteStatus(status);
}

export async function removeFavoriteInGallery(): Promise<void> {
  const status = await GalleryModel.removeFavorite();

  if (status === "success") {
    Events.favorites.favoriteRemoved.emit(GalleryModel.currentThumb().id);
  }
  GalleryView.showRemovedFavoriteStatus(status);
}
