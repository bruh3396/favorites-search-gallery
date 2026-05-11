import * as GalleryFavoriterFlow from "./favoriter_flow";
import * as GalleryModel from "../model/gallery_model";
import * as GalleryStateFlow from "./state_flow";
import * as GalleryView from "../view/gallery_view";
import { GalleryMenuAction } from "../../../types/ui";

const menuHandlers: Partial<Record<GalleryMenuAction, () => void>> = {
  exit: GalleryStateFlow.exitGallery,
  openPost: GalleryModel.openSelectedPost,
  openOriginal: GalleryModel.openSelectedMedia,
  download: GalleryModel.downloadSelected,
  addFavorite: GalleryFavoriterFlow.addFavoriteInGallery,
  removeFavorite: GalleryFavoriterFlow.removeFavoriteInGallery,
  toggleBackground: GalleryView.toggleBackgroundOpacity
};

export function onGalleryMenuAction(action: GalleryMenuAction): void {
  menuHandlers[action]?.();
}
