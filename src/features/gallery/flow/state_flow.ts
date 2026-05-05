import * as GalleryAutoplayController from "../control/autoplay_controller";
import * as GalleryInteractionTracker from "../control/interaction_tracker";
import * as GalleryModel from "../model/model";
import * as GalleryPreloadFlow from "./preload_flow";
import * as GalleryView from "../view/gallery_view";
import * as GalleryZoomFlow from "./zoom_flow";
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
