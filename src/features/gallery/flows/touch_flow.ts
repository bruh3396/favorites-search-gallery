import * as GalleryDispatch from "@/features/gallery/flows/dispatch";
import * as GalleryFavoriterFlow from "@/features/gallery/flows/favoriter_flow";
import * as GalleryNavigationFlow from "@/features/gallery/flows/navigation_flow";
import * as GalleryOpenCloseFlow from "@/features/gallery/flows/open_close_flow";
import { EnhancedMouseEvent } from "@/lib/input";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
import { didHold } from "@/app/dom/touch_hold_events";
import { didSwipe } from "@/app/dom/swipe_events";

export function handleMouseDown(event: EnhancedMouseEvent): void {
  GalleryDispatch.run({
    preview: handleMouseDownOutsideGallery,
    idle: handleMouseDownOutsideGallery
  }, event);
}

export function handleTouchStart(event: TouchEvent): void {
  GalleryDispatch.run({
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
  GalleryDispatch.run({ open: GalleryOpenCloseFlow.close });
}

export function favoriteCurrentPost(): void {
  GalleryDispatch.run({ open: GalleryFavoriterFlow.addFavoriteInGallery });
}

function navigateInGallery(direction: NavigationKey): void {
  if (didSwipe() || didHold()) {
    return;
  }
  GalleryDispatch.run({
    open: () => {
      GalleryNavigationFlow.navigate(direction);
    }
  });
}

function handleMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.thumb !== null && Preferences.gallery.mobileEnabled.value) {
    mouseEvent.originalEvent.preventDefault();
    mouseEvent.originalEvent.stopPropagation();
    mouseEvent.originalEvent.stopImmediatePropagation();
    GalleryOpenCloseFlow.open(mouseEvent.thumb);
  }
}

function handleTouchStartInGallery(event: TouchEvent): void {
  if (event.target instanceof HTMLElement && event.target.closest("#gallery-menu, #autoplay-menu") !== null) {
    return;
  }
  event.preventDefault();
}
