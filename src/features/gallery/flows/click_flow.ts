import * as GalleryDispatch from "@/features/gallery/flows/dispatch";
import * as GalleryModel from "@/features/gallery/model/gallery_model";
import * as GalleryOpenCloseFlow from "@/features/gallery/flows/open_close_flow";
import * as GalleryView from "@/features/gallery/view/gallery_view";
import { DomEvents } from "@/app/dom/events";
import { EnhancedMouseEvent } from "@/types/input";
import { Preferences } from "@/app/context/preferences";
import { overGalleryMenu } from "@/features/gallery/dom_tweaks/menu";
import { throttle } from "@/lib/async/throttle";

export const onMouseMove = throttle<MouseEvent>(() => {
  GalleryDispatch.run({
    open: GalleryView.showCursor
  });
}, 250);

export function onClick(mouseEvent: EnhancedMouseEvent): void {
  GalleryDispatch.run({
    open: onClickInGallery
  }, mouseEvent.originalEvent);
}

export function onMouseDown(event: EnhancedMouseEvent): void {
  GalleryDispatch.run({
    preview: onMouseDownOutsideGallery,
    idle: onMouseDownOutsideGallery,
    open: onMouseDownInGallery
  }, event);
}

export function onContextMenu(mouseEvent: MouseEvent): void {
  GalleryDispatch.run({
    open: onContextMenuInGallery
  }, mouseEvent);
}

export function toggleGalleryImageZoom(value: undefined | boolean = undefined): boolean {
  const zoomedIn = GalleryView.toggleZoom(value);

  DomEvents.document.wheel.toggle(!zoomedIn);
  return zoomedIn;
}

function onClickInGallery(mouseEvent: MouseEvent): void {
  if (mouseEvent.ctrlKey) {
    GalleryModel.openMedia();
  }
}

function onMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.leftClick && mouseEvent.thumb !== null && !mouseEvent.ctrlKey && !mouseEvent.shiftKey) {
    mouseEvent.originalEvent.preventDefault();
    GalleryOpenCloseFlow.open(mouseEvent.thumb);
    return;
  }

  if (mouseEvent.middleClick && mouseEvent.thumb === null && !clickedInteractiveOverlay(mouseEvent)) {
    mouseEvent.originalEvent.preventDefault();
    Preferences.gallery.previewEnabled.set(!GalleryModel.isShowingPreviews());
  }
}

function clickedInteractiveOverlay(mouseEvent: EnhancedMouseEvent): boolean {
  const target = mouseEvent.originalEvent.target;
  return target instanceof HTMLElement && target.closest(".post-overlay") !== null;
}

function onMouseDownInGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.ctrlKey || overGalleryMenu(mouseEvent.originalEvent)) {
    return;
  }

  if (mouseEvent.shiftKey) {
    if (toggleGalleryImageZoom()) {
      GalleryView.zoomToPoint(mouseEvent.originalEvent.x, mouseEvent.originalEvent.y);
    }
    return;
  }
  const zoomedIn = mouseEvent.originalEvent.target instanceof HTMLElement && mouseEvent.originalEvent.target.closest(".zoomed-in") !== null;

  if (mouseEvent.leftClick && !zoomedIn && !GalleryModel.isViewingVideo()) {
    GalleryOpenCloseFlow.close();
    return;
  }

  if (mouseEvent.rightClick) {
    return;
  }

  if (mouseEvent.middleClick) {
    GalleryModel.openPost();
  }
}

function onContextMenuInGallery(mouseEvent: MouseEvent): void {
  mouseEvent.preventDefault();
  GalleryOpenCloseFlow.close();
}
