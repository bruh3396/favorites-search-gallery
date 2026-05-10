  import * as GalleryView from "../view/gallery_view";
import { DomEvents } from "../../../lib/communication/dom_events";

  export function toggleGalleryImageZoom(value: undefined | boolean = undefined): boolean {
    const zoomedIn = GalleryView.toggleZoom(value);

    DomEvents.document.wheel.toggle(!zoomedIn);
    return zoomedIn;
  }
