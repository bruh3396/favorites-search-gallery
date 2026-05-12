import * as GalleryModel from "../model/gallery_model";
import * as GalleryView from "../view/gallery_view";
import { AddFavoriteStatus, RemoveFavoriteStatus } from "../../../types/favorite";
import { Events } from "../../../lib/communication/events";

export async function addFavoriteInGallery(): Promise<void> {
  const status = await GalleryModel.addFavorite();

  if (status === AddFavoriteStatus.Success) {
    Events.gallery.favoriteToggled.emit(GalleryModel.currentThumb().id);
  }
  GalleryView.showAddedFavoriteStatus(status);
}

export async function removeFavoriteInGallery(): Promise<void> {
  const status = await GalleryModel.removeFavorite();

  if (status === RemoveFavoriteStatus.Success) {
    Events.gallery.favoriteToggled.emit(GalleryModel.currentThumb().id);
    Events.favorites.favoriteRemoved.emit(GalleryModel.currentThumb().id);
  }
  GalleryView.showRemovedFavoriteStatus(status);
}
