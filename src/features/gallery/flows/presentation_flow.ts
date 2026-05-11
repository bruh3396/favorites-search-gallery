import * as GalleryModel from "../model/gallery_model";
import * as GalleryPreloadFlow from "./preload_flow";
import * as GalleryView from "../view/gallery_view";
import { Events } from "../../../lib/communication/events";

export function present(thumb: HTMLElement): void {
  GalleryView.present(thumb);
  Events.gallery.presentedThumb.emit(thumb);
  GalleryPreloadFlow.preloadInGalleryAround(thumb);
}

export function presentSelected(): void {
  present(GalleryModel.getSelectedThumb());
}