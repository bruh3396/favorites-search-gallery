import { DO_NOTHING } from "../../../../../lib/environment/constants";
import { Events } from "../../../../../lib/communication/events/events";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { InteractionTracker } from "../../../../../lib/core/observers/interaction_tracker";
import { ON_MOBILE_DEVICE } from "../../../../../lib/environment/environment";

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
    DO_NOTHING,
    onInteractionStopped,
    DO_NOTHING,
    onInteractionStopped
  );
}
