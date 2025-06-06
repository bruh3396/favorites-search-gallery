import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryPreloadFlow from "./gallery_preload_flow";
import * as GalleryView from "../../../view/gallery_view";
import { Events } from "../../../../../lib/globals/events";

export function enterGallery(thumb: HTMLElement): void {
  GalleryModel.enterGallery(thumb);
  GalleryView.enterGallery(thumb);
  // this.interactionTracker?.start();
  // this.autoplayController.start(thumb);
  GalleryPreloadFlow.preloadContentInGalleryAround(thumb);
  Events.gallery.showOnHover.emit(false);
  Events.gallery.enteredGallery.emit();
}

export function exitGallery(): void {
  GalleryModel.exitGallery();
  GalleryView.exitGallery();
  // this.interactionTracker?.stop();
  // this.autoplayController?.stop();
  // this.toggleGalleryImageZoom(false);
  Events.gallery.exitedGallery.emit();
}

export function toggleShowContentOnHover(): void {
  GalleryModel.toggleShowContentOnHover();
  Events.gallery.showOnHover.emit(GalleryModel.showOnHoverEnabled());
}
