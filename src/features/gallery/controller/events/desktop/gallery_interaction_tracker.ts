import * as GalleryView from "../../../view/gallery_view";
import { ON_DESKTOP_DEVICE, ON_MOBILE_DEVICE } from "../../../../../lib/global/flags/intrinsic_flags";
import { DO_NOTHING } from "../../../../../utils/misc/async";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { InteractionTracker } from "../../../../../lib/components/interaction_tracker";
import { executeFunctionBasedOnGalleryState } from "../../flows/runtime/gallery_runtime_flow_utils";

export let GalleryInteractionTracker: InteractionTracker | null = null;

function createGalleryInteractionTracker(): InteractionTracker | null {
  if (ON_MOBILE_DEVICE) {
    return null;
  }
  const hideCursor = (): void => {
    executeFunctionBasedOnGalleryState({
      gallery: () => {
        GalleryView.toggleCursor(false);
      }
    });
  };
  return new InteractionTracker(
    GallerySettings.idleInteractionDuration,
    DO_NOTHING,
    hideCursor,
    DO_NOTHING,
    hideCursor
  );
}

export function setupGalleryInteractionTracker(): void {
  if (ON_DESKTOP_DEVICE) {
    GalleryInteractionTracker = createGalleryInteractionTracker();
  }
}
