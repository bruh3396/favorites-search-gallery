import * as GalleryControl from "@/features/gallery/control/control";
import * as GalleryFlows from "@/features/gallery/flows/flows";
import * as GalleryModel from "@/features/gallery/model/model";
import * as GalleryView from "@/features/gallery/view/view";
import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { Preferences } from "@/app/context/preferences";

export function open(thumb: HTMLElement): void {
  disablePreview();
  GalleryModel.open(thumb);
  GalleryView.open(thumb);
  GalleryFlows.Display.display(thumb);
  GalleryControl.enableInteractionTracking();
  Events.gallery.openedGallery.emit(thumb);
}

export function close(): void {
  GalleryModel.close();
  GalleryView.close();
  GalleryControl.disableInteractionTracking();
  DomEvents.document.wheel.toggle(true);
  Events.gallery.closedGallery.emit();
}

export function reOpen(): void {
  open(GalleryModel.currentThumb());
}

function disablePreview(): void {
  if (Preferences.gallery.previewEnabled.value) {
    Preferences.gallery.previewEnabled.set(false);
  }
}
