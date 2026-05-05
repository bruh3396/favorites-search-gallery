import { Events } from "../../../lib/communication/events";
import { GallerySettings } from "../../../config/gallery_settings";
import { InteractionTracker } from "../../../lib/core/observers/interaction_tracker";
import { ON_MOBILE_DEVICE } from "../../../lib/environment/environment";
import { doNothing } from "../../../lib/environment/constants";

let galleryInteractionTracker: InteractionTracker | null = null;

export function setupGalleryInteractionTracker(): void {
  if (ON_MOBILE_DEVICE) {
    return;
  }
  const onInteractionStopped = (): void => {
    Events.gallery.interactionStopped.emit();
  };

  galleryInteractionTracker = new InteractionTracker(
    GallerySettings.idleInteractionDuration,
    doNothing,
    onInteractionStopped,
    doNothing,
    onInteractionStopped
  );
}

export function enableInteractionTracking(): void {
  galleryInteractionTracker?.enable();
}

export function disableInteractionTracking(): void {
  galleryInteractionTracker?.disable();
}
