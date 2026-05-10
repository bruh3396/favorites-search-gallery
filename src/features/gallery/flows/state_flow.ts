import * as GalleryInteractionTracker from "../control/interaction_tracker";
import * as GalleryModel from "../model/gallery_model";
import * as GalleryPreloadFlow from "./preload_flow";
import * as GalleryView from "../view/gallery_view";
import * as GalleryZoomFlow from "./zoom_flow";
import { Events } from "../../../lib/communication/events";

export function enterGallery(thumb: HTMLElement): void {
  GalleryModel.enterGallery(thumb);
  GalleryView.enterGallery(thumb);
  GalleryInteractionTracker.enableInteractionTracking();
  GalleryPreloadFlow.preloadInGalleryAround(thumb);
  Events.gallery.showOnHoverOverridden.emit(false);
  Events.gallery.enteredGallery.emit(thumb);
}

export function exitGallery(): void {
  GalleryModel.exitGallery();
  GalleryView.exitGallery();
  GalleryInteractionTracker.disableInteractionTracking();
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
