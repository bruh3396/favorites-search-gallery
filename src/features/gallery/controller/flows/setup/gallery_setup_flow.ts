import { GALLERY_ENABLED } from "../../../../../lib/globals/flags";
import { insertGalleryContainer } from "../../../view/ui/gallery_container";

export function setupGallery(): void {
  if (GALLERY_ENABLED) {
    insertGalleryContainer();
  }
}
