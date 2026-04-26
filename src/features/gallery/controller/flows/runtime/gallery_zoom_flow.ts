  import * as GalleryView from "../../../view/gallery_view";
import { Events } from "../../../../../lib/communication/events";

  export function toggleGalleryImageZoom(value: undefined | boolean = undefined): boolean {
    const zoomedIn = GalleryView.toggleZoom(value);

    Events.document.wheel.toggle(!zoomedIn);
    return zoomedIn;
  }
