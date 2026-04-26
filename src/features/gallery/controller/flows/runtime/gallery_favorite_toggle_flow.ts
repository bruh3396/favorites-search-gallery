import * as FavoriteToggler from "../../../../../utils/favorite_toggler";
import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryView from "../../../view/gallery_view";

export async function addFavoriteInGallery(): Promise<void> {
  GalleryView.showAddedFavoriteStatus(await FavoriteToggler.addFavorite(GalleryModel.getCurrentThumb()));
}

export async function removeFavoriteInGallery(): Promise<void> {
  GalleryView.showRemovedFavoriteStatus(await FavoriteToggler.removeFavorite(GalleryModel.getCurrentThumb()));
}
