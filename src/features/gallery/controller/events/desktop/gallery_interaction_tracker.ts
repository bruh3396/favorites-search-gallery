import { DO_NOTHING } from "../../../../../utils/misc/async";
import { Events } from "../../../../../lib/global/events/events";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { InteractionTracker } from "../../../../../lib/components/interaction_tracker";
import { ON_MOBILE_DEVICE } from "../../../../../lib/global/flags/intrinsic_flags";

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
