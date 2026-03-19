import * as GalleryView from "../../../view/gallery_view";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";

export function onInteractionStopped(): void {
      executeFunctionBasedOnGalleryState({
        gallery: () => {
          GalleryView.toggleCursor(false);
        }
      });
}
