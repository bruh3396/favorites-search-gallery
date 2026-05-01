import * as GalleryAutoplayController from "../control/gallery_autoplay_controller";
import * as GalleryModel from "../model/gallery_model";
import * as GalleryPreloadFlow from "./gallery_preload_flow";
import * as GalleryView from "../view/gallery_view";
import * as GalleryZoomFlow from "./gallery_zoom_flow";
import { Events } from "../../../lib/communication/events";
import { GalleryInteractionTracker } from "../control/gallery_interaction_tracker";

export function enterGallery(thumb: HTMLElement): void {
  GalleryModel.enterGallery(thumb);
  GalleryView.enterGallery(thumb);
  GalleryInteractionTracker?.enable();
  GalleryAutoplayController.startAutoplay(thumb);
  GalleryPreloadFlow.preloadContentInGalleryAround(thumb);
  Events.gallery.showOnHoverOverridden.emit(false);
  Events.gallery.enteredGallery.emit();
}

export function exitGallery(): void {
  GalleryModel.exitGallery();
  GalleryView.exitGallery();
  GalleryInteractionTracker?.disable();
  GalleryAutoplayController.stopAutoplay();
  GalleryZoomFlow.toggleGalleryImageZoom(false);
  Events.gallery.exitedGallery.emit();
}

export function toggleShowingContentOnHover(): void {
  GalleryModel.toggleShowingContentOnHover();
  Events.gallery.showOnHoverOverridden.emit(GalleryModel.showingContentOnHover());
}
