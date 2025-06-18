import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryView from "../../../view/gallery_view";

export async function addFavoriteInGallery(): Promise<void> {
  GalleryView.showAddedFavoriteStatus(await GalleryModel.addFavoriteInGallery());
}

export async function removeFavoriteInGallery(): Promise<void> {
  GalleryView.showRemovedFavoriteStatus(await GalleryModel.removeFavoriteInGallery());
}
