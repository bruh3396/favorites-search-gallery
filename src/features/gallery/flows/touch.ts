import * as GalleryFlows from "@/features/gallery/flows/flows";
import { EnhancedMouseEvent } from "@/lib/input";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
import { didHold } from "@/app/dom/touch_hold_events";
import { didSwipe } from "@/app/dom/swipe_events";

export function handleMouseDown(event: EnhancedMouseEvent): void {
  GalleryFlows.Dispatch.run({
    preview: handleMouseDownOutsideGallery,
    idle: handleMouseDownOutsideGallery
  }, event);
}

export function handleTouchStart(event: TouchEvent): void {
  GalleryFlows.Dispatch.run({
    open: handleTouchStartInGallery
  }, event);
}

export function navigateBackInGallery(): void {
  navigateInGallery("ArrowLeft");
}

export function navigateForwardInGallery(): void {
  navigateInGallery("ArrowRight");
}

export function closeGallery(): void {
  GalleryFlows.Dispatch.run({ open: GalleryFlows.OpenClose.close });
}

export function favoriteCurrentPost(): void {
  GalleryFlows.Dispatch.run({ open: GalleryFlows.Favoriter.addFavoriteInGallery });
}

function navigateInGallery(direction: NavigationKey): void {
  if (didSwipe() || didHold()) {
    return;
  }
  GalleryFlows.Dispatch.run({
    open: () => {
      GalleryFlows.Navigation.navigate(direction);
    }
  });
}

function handleMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.thumb !== null && Preferences.gallery.mobileEnabled.value) {
    mouseEvent.originalEvent.preventDefault();
    mouseEvent.originalEvent.stopPropagation();
    mouseEvent.originalEvent.stopImmediatePropagation();
    GalleryFlows.OpenClose.open(mouseEvent.thumb);
  }
}

function handleTouchStartInGallery(event: TouchEvent): void {
  if (event.target instanceof HTMLElement && event.target.closest("#gallery-menu, #autoplay-menu") !== null) {
    return;
  }
  event.preventDefault();
}
