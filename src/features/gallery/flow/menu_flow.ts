import * as GalleryFavoriteToggleFlow from "./favorite_toggle_flow";
import * as GalleryModel from "../model/model";
import * as GalleryStateFlow from "./state_flow";
import * as GalleryView from "../view/gallery_view";
import { GalleryMenuAction } from "../../../types/ui";

const menuHandlers: Partial<Record<GalleryMenuAction, () => void>> = {
  exit: GalleryStateFlow.exitGallery,
  openPost: GalleryModel.openPostInNewTab,
  openOriginal: GalleryModel.openOriginalInNewTab,
  download: GalleryModel.downloadInGallery,
  addFavorite: GalleryFavoriteToggleFlow.addFavoriteInGallery,
  removeFavorite: GalleryFavoriteToggleFlow.removeFavoriteInGallery,
  toggleBackground: GalleryView.toggleBackgroundOpacity
};

export function onGalleryMenuAction(action: GalleryMenuAction): void {
  menuHandlers[action]?.();
}
