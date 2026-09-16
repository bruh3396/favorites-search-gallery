import { GalleryFlow } from "@/features/gallery/flows/flow";
import { GalleryMenuAction } from "@/types/app";

export class GalleryMenuFlow extends GalleryFlow {
  private readonly menuHandlers: Partial<Record<GalleryMenuAction, () => void>> = {
    exit: () => this.flows.openClose.close(),
    openPost: () => this.model.openPost(),
    openOriginal: () => this.model.openMedia(),
    download: () => this.model.download(),
    addFavorite: () => this.flows.favoriter.addFavoriteInGallery(),
    removeFavorite: () => this.flows.favoriter.removeFavoriteInGallery(),
    toggleBackground: () => this.flows.background.toggleBackgroundOpacity(),
    pin: () => this.togglePin(),
    toggleDockPosition: () => this.toggleDockPosition()
  };

  public handleAction(action: GalleryMenuAction): void {
    this.menuHandlers[action]?.();
  }

  private togglePin(): void {
    this.context.preferences.gallery.menuPinned.set(!this.context.preferences.gallery.menuPinned.value);
  }

  private toggleDockPosition(): void {
    this.context.preferences.gallery.menuDockedLeft.set(!this.context.preferences.gallery.menuDockedLeft.value);
  }
}
