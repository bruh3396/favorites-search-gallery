import * as GalleryDisplayFlow from "@/features/gallery/flows/display_flow";
import * as GalleryInteractionTracker from "@/features/gallery/control/interaction_tracker";
import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { DomEvents } from "@/app/input/dom_events";
import { Events } from "@/app/channels/events";

export function open(thumb: HTMLElement): void {
  GalleryModel.open(thumb);
  GalleryView.open(thumb);
  GalleryDisplayFlow.display(thumb);

  GalleryInteractionTracker.enableInteractionTracking();
  Events.gallery.showOnHoverOverridden.emit(false);
  Events.gallery.openedGallery.emit(thumb);
}

export function close(): void {
  GalleryModel.close();
  GalleryView.close();

  GalleryInteractionTracker.disableInteractionTracking();
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
