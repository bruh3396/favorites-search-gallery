import { GalleryFlow } from "@/features/gallery/flows/flow";
import { vibrate } from "@/utils/browser/haptics";

export class GalleryFavoriterFlow extends GalleryFlow {
  public async addFavoriteInGallery(): Promise<void> {
    const status = await this.model.addFavorite();

    if (status === "success") {
      this.context.events.app.favoriteAdded.emit(this.model.currentThumb().id);

      if (this.context.environment.onMobileDevice) {
        vibrate(15);
      }
    }
    this.view.showAddedFavoriteStatus(status);
  }

  public async removeFavoriteInGallery(): Promise<void> {
    const status = await this.model.removeFavorite();

    if (status === "success") {
      this.context.events.app.favoriteRemoved.emit(this.model.currentThumb().id);
    }
    this.view.showRemovedFavoriteStatus(status);
  }
}
