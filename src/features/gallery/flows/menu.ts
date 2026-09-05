import * as GalleryFlows from "@/features/gallery/flows/flows";
import * as GalleryModel from "@/features/gallery/model/model";
import { GalleryMenuAction } from "@/types/app";
import { Preferences } from "@/app/context/preferences";

const menuHandlers: Partial<Record<GalleryMenuAction, () => void>> = {
  exit: () => GalleryFlows.OpenClose.close(),
  openPost: GalleryModel.openPost,
  openOriginal: GalleryModel.openMedia,
  download: GalleryModel.download,
  addFavorite: () => GalleryFlows.Favoriter.addFavoriteInGallery(),
  removeFavorite: () => GalleryFlows.Favoriter.removeFavoriteInGallery(),
  toggleBackground: () => GalleryFlows.Background.toggleBackgroundOpacity(),
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
