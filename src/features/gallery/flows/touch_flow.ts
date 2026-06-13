import * as GalleryNavigationFlow from "@/features/gallery/flows/navigation_flow";
import * as GalleryOpenCloseFlow from "@/features/gallery/flows/open_close_flow";
import { ON_FAVORITES_PAGE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { EnhancedMouseEvent } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
import { didSwipe } from "@/app/dom/swipe_events";
import * as GalleryDispatch from "@/features/gallery/flows/dispatch";

export function onMouseDown(event: MouseEvent): void {
  GalleryDispatch.run({
    preview: onMouseDownOutsideGallery,
    idle: onMouseDownOutsideGallery
  }, new EnhancedMouseEvent(event));
}

export function onTouchStart(event: TouchEvent): void {
  GalleryDispatch.run({
    open: onTouchStartInGallery
  }, event);
}

export function onLeftTap(): void {
  if (didSwipe()) {
    return;
  }
  GalleryDispatch.run({
    open: () => {
      GalleryNavigationFlow.navigate("ArrowLeft");
    }
  });
}

export function onRightTap(): void {
  if (didSwipe()) {
    return;
  }
  GalleryDispatch.run({
    open: () => {
      GalleryNavigationFlow.navigate("ArrowRight");
    }
  });
}

export function onSwipeDown(): void {
  GalleryDispatch.run({ open: GalleryOpenCloseFlow.close });
}

function onMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.thumb !== null && galleryEnabled()) {
    mouseEvent.originalEvent.preventDefault();
    mouseEvent.originalEvent.stopPropagation();
    mouseEvent.originalEvent.stopImmediatePropagation();
    GalleryOpenCloseFlow.open(mouseEvent.thumb);
  }
}

function onTouchStartInGallery(event: TouchEvent): void {
  if (event.target instanceof HTMLElement && event.target.closest("#gallery-menu") !== null) {
    return;
  }
  event.preventDefault();
}

function galleryEnabled(): boolean {
  return (ON_FAVORITES_PAGE && Preferences.galleryMobileEnabled.value) || (ON_POST_LIST_PAGE && Preferences.postListEnabled.value);
}
