  import * as GalleryView from "../../../view/gallery_view";
import { Events } from "../../../../../lib/global/events/events";

  export function toggleGalleryImageZoom(value: undefined | boolean = undefined): boolean {
    const zoomedIn = GalleryView.toggleZoom(value);

    Events.document.wheel.toggle(!zoomedIn);
    return zoomedIn;
  }
