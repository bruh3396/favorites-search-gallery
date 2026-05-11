import * as GalleryClickFlow from "./click_flow";
import * as GalleryInteractionTracker from "../control/interaction_tracker";
import * as GalleryModel from "../model/gallery_model";
import * as GalleryPresentationFlow from "./presentation_flow";
import * as GalleryView from "../view/gallery_view";
import { Events } from "../../../lib/communication/events";

export function enterGallery(thumb: HTMLElement): void {
  GalleryModel.enterGallery(thumb);
  GalleryView.enterGallery(thumb);
  GalleryInteractionTracker.enableInteractionTracking();
  GalleryPresentationFlow.present(thumb);
  Events.gallery.showOnHoverOverridden.emit(false);
  Events.gallery.enteredGallery.emit(thumb);
}

export function exitGallery(): void {
  GalleryModel.exitGallery();
  GalleryView.exitGallery();
  GalleryInteractionTracker.disableInteractionTracking();
  GalleryClickFlow.toggleGalleryImageZoom(false);
  Events.gallery.exitedGallery.emit();
}

export function reEnterGallery(): void {
  const thumb = GalleryModel.getSelectedThumb();

  if (thumb) {
    enterGallery(thumb);
  }
}

export function toggleEnlargeOnHover(): void {
  GalleryModel.toggleEnlargeOnHover();
  Events.gallery.showOnHoverOverridden.emit(GalleryModel.isEnlargingOnHover());
}
