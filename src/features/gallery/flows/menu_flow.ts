import * as GalleryBackgroundFlow from "@/features/gallery/flows/background_flow";
import * as GalleryFavoriterFlow from "@/features/gallery/flows/favoriter_flow";
import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryOpenCloseFlow from "@/features/gallery/flows/open_close_flow";
import { GalleryMenuAction } from "@/types/app";
import { Preferences } from "@/app/context/preferences";

const menuHandlers: Partial<Record<GalleryMenuAction, () => void>> = {
  exit: GalleryOpenCloseFlow.close,
  openPost: GalleryModel.openPost,
  openOriginal: GalleryModel.openMedia,
  download: GalleryModel.download,
  addFavorite: GalleryFavoriterFlow.addFavoriteInGallery,
  removeFavorite: GalleryFavoriterFlow.removeFavoriteInGallery,
  toggleBackground: GalleryBackgroundFlow.toggleBackgroundOpacity,
  pin: togglePin,
  toggleDockPosition
};

export function handleAction(action: GalleryMenuAction): void {
  menuHandlers[action]?.();
}

function togglePin(): void {
  Preferences.gallery.menuPinned.set(!Preferences.gallery.menuPinned.value);
}

function toggleDockPosition(): void {
  Preferences.gallery.menuDockedLeft.set(!Preferences.gallery.menuDockedLeft.value);
}
