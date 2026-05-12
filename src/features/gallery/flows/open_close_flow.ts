import * as GalleryInteractionTracker from "../control/interaction_tracker";
import * as GalleryModel from "../model/gallery_model";
import * as GalleryPresentationFlow from "./presentation_flow";
import * as GalleryView from "../view/gallery_view";
import { DomEvents } from "../../../lib/communication/dom_events";
import { Events } from "../../../lib/communication/events";

export function open(thumb: HTMLElement): void {
  GalleryModel.enter(thumb);
  GalleryView.show(thumb);
  GalleryInteractionTracker.enableInteractionTracking();
  GalleryPresentationFlow.present(thumb);
  Events.gallery.showOnHoverOverridden.emit(false);
  Events.gallery.openedGallery.emit(thumb);
}

export function close(): void {
  GalleryModel.exit();
  GalleryView.hide();
  GalleryInteractionTracker.disableInteractionTracking();
  GalleryView.toggleZoom(false);
  DomEvents.document.wheel.toggle(true);
  Events.gallery.closedGallery.emit();
}

export function reOpen(): void {
  open(GalleryModel.currentThumb());
}

export function toggleEnlargeOnHover(): void {
  GalleryModel.toggleEnlargeOnHover();
  Events.gallery.showOnHoverOverridden.emit(GalleryModel.isEnlargingOnHover());
}
