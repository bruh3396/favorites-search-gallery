import { Events } from "../../lib/global/events/events";
import { GALLERY_DISABLED } from "../../lib/global/flags/derived_flags";

export function isInGallery(): Promise<boolean> {
  if (GALLERY_DISABLED) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    Events.gallery.inGalleryResponse.timeout(10)
      .then((inGallery) => {
        resolve(inGallery);
      })
      .catch(() => {
        resolve(false);
      });
    Events.favorites.inGalleryRequest.emit();
  });
}
