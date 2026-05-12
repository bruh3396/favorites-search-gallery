import * as GalleryFavoriterFlow from "./favoriter_flow";
import * as GalleryModel from "../model/gallery_model";
import * as GalleryOpenCloseFlow from "./open_close_flow";
import * as GalleryView from "../view/gallery_view";
import { GalleryMenuAction } from "../../../types/ui";

const menuHandlers: Partial<Record<GalleryMenuAction, () => void>> = {
  exit: GalleryOpenCloseFlow.close,
  openPost: GalleryModel.openPost,
  openOriginal: GalleryModel.openMedia,
  download: GalleryModel.download,
  addFavorite: GalleryFavoriterFlow.addFavoriteInGallery,
  removeFavorite: GalleryFavoriterFlow.removeFavoriteInGallery,
  toggleBackground: GalleryView.toggleBackgroundOpacity
};

export function onGalleryMenuAction(action: GalleryMenuAction): void {
  menuHandlers[action]?.();
}
