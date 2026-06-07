import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { GalleryConfig } from "@/config/gallery_config";
import { InteractionTracker } from "@/lib/observer/interaction_tracker";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { doNothing } from "@/utils/function";

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
    onInteractionStopped,
    DomEvents.document.mousemove.on,
    DomEvents.window.scroll.on
  );
}

export function enableInteractionTracking(): void {
  galleryInteractionTracker?.enable();
}

export function disableInteractionTracking(): void {
  galleryInteractionTracker?.disable();
}
