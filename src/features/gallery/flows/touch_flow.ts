import * as GalleryDispatch from "@/features/gallery/flows/dispatch";
import * as GalleryNavigationFlow from "@/features/gallery/flows/navigation_flow";
import * as GalleryOpenCloseFlow from "@/features/gallery/flows/open_close_flow";
import { ON_FAVORITES_PAGE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { EnhancedMouseEvent } from "@/lib/input/mouse_event";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
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

function navigateInGallery(direction: NavigationKey): void {
  if (didSwipe()) {
    return;
  }
  GalleryDispatch.run({
    open: () => {
      GalleryNavigationFlow.navigate(direction);
    }
  });
}

function handleMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.thumb !== null && galleryEnabled()) {
    mouseEvent.originalEvent.preventDefault();
    mouseEvent.originalEvent.stopPropagation();
    mouseEvent.originalEvent.stopImmediatePropagation();
    GalleryOpenCloseFlow.open(mouseEvent.thumb);
  }
}

function handleTouchStartInGallery(event: TouchEvent): void {
  if (event.target instanceof HTMLElement && event.target.closest("#gallery-menu") !== null) {
    return;
  }
  event.preventDefault();
}

function galleryEnabled(): boolean {
  return (ON_FAVORITES_PAGE && Preferences.gallery.mobileEnabled.value) || ON_POST_LIST_PAGE;
}
