import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryPreloadFlow from "@/features/gallery/flows/preload_flow";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { Events } from "@/app/channels/events";

export function display(thumb: HTMLElement): void {
  GalleryView.display(thumb);
  Events.gallery.displayedThumb.emit(thumb);
  GalleryPreloadFlow.preloadInGalleryAround(thumb);
}

export function displaySelected(): void {
  display(GalleryModel.currentThumb());
}
