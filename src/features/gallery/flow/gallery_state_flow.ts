import * as GalleryAutoplayController from "../control/gallery_autoplay_controller";
import * as GalleryInteractionTracker from "../control/gallery_interaction_tracker";
import * as GalleryModel from "../model/gallery_model";
import * as GalleryPreloadFlow from "./gallery_preload_flow";
import * as GalleryView from "../view/gallery_view";
import * as GalleryZoomFlow from "./gallery_zoom_flow";
import { Events } from "../../../lib/communication/events";

export function enterGallery(thumb: HTMLElement): void {
  GalleryModel.enterGallery(thumb);
  GalleryView.enterGallery(thumb);
  GalleryInteractionTracker.enableInteractionTracking();
  GalleryAutoplayController.startAutoplay(thumb);
  GalleryPreloadFlow.preloadInGalleryAround(thumb);
  Events.gallery.showOnHoverOverridden.emit(false);
  Events.gallery.enteredGallery.emit();
}

export function exitGallery(): void {
  GalleryModel.exitGallery();
  GalleryView.exitGallery();
  GalleryInteractionTracker.disableInteractionTracking();
  GalleryAutoplayController.stopAutoplay();
  GalleryZoomFlow.toggleGalleryImageZoom(false);
  Events.gallery.exitedGallery.emit();
}

export function reEnterGallery(): void {
  const thumb = GalleryModel.getCurrentThumb();

  if (thumb) {
    enterGallery(thumb);
  }
}

export function toggleShowingContentOnHover(): void {
  GalleryModel.toggleShowingContentOnHover();
  Events.gallery.showOnHoverOverridden.emit(GalleryModel.showingContentOnHover());
}
