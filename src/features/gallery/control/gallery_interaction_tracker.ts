import { Events } from "../../../lib/communication/events";
import { GallerySettings } from "../../../config/gallery_settings";
import { InteractionTracker } from "../../../lib/core/observers/interaction_tracker";
import { ON_MOBILE_DEVICE } from "../../../lib/environment/environment";
import { doNothing } from "../../../lib/environment/constants";

export let GalleryInteractionTracker: InteractionTracker | null = null;

export function setupGalleryInteractionTracker(): void {
  if (ON_MOBILE_DEVICE) {
    return;
  }
  const onInteractionStopped = (): void => {
      Events.gallery.interactionStopped.emit();
    };

  GalleryInteractionTracker = new InteractionTracker(
    GallerySettings.idleInteractionDuration,
    doNothing,
    onInteractionStopped,
    doNothing,
    onInteractionStopped
  );
}
