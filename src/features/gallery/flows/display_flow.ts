import * as GalleryModel from "../model/gallery_model";
import * as GalleryPreloadFlow from "./preload_flow";
import * as GalleryView from "../view/gallery_view";
import { Events } from "../../../app/messaging/events";

export function display(thumb: HTMLElement): void {
  GalleryView.display(thumb);
  Events.gallery.displayedThumb.emit(thumb);
  GalleryPreloadFlow.preloadInGalleryAround(thumb);
}

export function displaySelected(): void {
  display(GalleryModel.currentThumb());
}
