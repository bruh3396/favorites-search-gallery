import * as GalleryFavoriterFlow from "@/features/gallery/flows/favoriter_flow";
import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryOpenCloseFlow from "@/features/gallery/flows/open_close_flow";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { GalleryMenuAction } from "@/types/app";

const menuHandlers: Partial<Record<GalleryMenuAction, () => void>> = {
  exit: GalleryOpenCloseFlow.close,
  openPost: GalleryModel.openPost,
  openOriginal: GalleryModel.openMedia,
  download: GalleryModel.download,
  addFavorite: GalleryFavoriterFlow.addFavoriteInGallery,
  removeFavorite: GalleryFavoriterFlow.removeFavoriteInGallery,
  toggleBackground: GalleryView.toggleBackgroundOpacity
};

export function handleAction(action: GalleryMenuAction): void {
  menuHandlers[action]?.();
}
