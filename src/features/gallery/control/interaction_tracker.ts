import { Events } from "../../../lib/communication/events";
import { GalleryConfig } from "../../../config/gallery_config";
import { InteractionTracker } from "../../../lib/core/observers/interaction_tracker";
import { ON_MOBILE_DEVICE } from "../../../lib/environment/environment";
import { doNothing } from "../../../lib/environment/constants";

let galleryInteractionTracker: InteractionTracker | null = null;

export function setup(): void {
  if (ON_MOBILE_DEVICE) {
    return;
  }
  const onInteractionStopped = (): void => {
    Events.gallery.interactionStopped.emit();
  };

  galleryInteractionTracker = new InteractionTracker(
    GalleryConfig.idleInteractionDuration,
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
