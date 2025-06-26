import * as GalleryFavoriteToggleFlow from "./gallery_favorite_toggle_flow";
import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryStateFlow from "./gallery_state_flow";
import * as GalleryView from "../../../view/gallery_view";
import { GalleryMenuAction } from "../../../types/gallery_types";

export function onGalleryMenuAction(action: GalleryMenuAction): void {
  switch (action) {
    case "exit":
      GalleryStateFlow.exitGallery();
      break;

    case "openPost":
      GalleryModel.openPostInNewTab();
      break;

    case "openOriginal":
      GalleryModel.openOriginalInNewTab();
      break;

    case "download":
      GalleryModel.downloadInGallery();
      break;

    case "addFavorite":
      GalleryFavoriteToggleFlow.addFavoriteInGallery();
      break;

    case "removeFavorite":
      GalleryFavoriteToggleFlow.removeFavoriteInGallery();
      break;

    case "toggleBackground":
      GalleryView.toggleBackgroundOpacity();
      break;

    case "none":
      break;

    default:
      break;
  }
}
