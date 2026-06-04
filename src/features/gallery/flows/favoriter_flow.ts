import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "@/types/favorite";
import { Events } from "@/app/channels/events";

export async function addFavoriteInGallery(): Promise<void> {
  const status = await GalleryModel.addFavorite();

  if (status === AddFavoriteStatus.Success) {
    Events.favorites.favoriteAdded.emit(GalleryModel.currentThumb().id);
  }
  GalleryView.showAddedFavoriteStatus(status);
}

export async function removeFavoriteInGallery(): Promise<void> {
  const status = await GalleryModel.removeFavorite();

  if (status === RemoveFavoriteStatus.Success) {
    Events.favorites.favoriteRemoved.emit(GalleryModel.currentThumb().id);
  }
  GalleryView.showRemovedFavoriteStatus(status);
}
