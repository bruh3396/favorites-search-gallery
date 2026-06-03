import * as GalleryModel from "../model/gallery_model";
import * as GalleryOpenCloseFlow from "./open_close_flow";
import * as GalleryView from "../view/gallery_view";
import { DomEvents } from "../../../app/input/dom_events";
import { EnhancedMouseEvent } from "../../../types/input";
import { dispatchByState } from "./state_dispatch";
import { throttle } from "../../../lib/async/throttle";

export const onMouseMove = throttle<MouseEvent>(() => {
  dispatchByState({
    open: GalleryView.showCursor
  });
}, 250);

export function onClick(mouseEvent: MouseEvent): void {
  dispatchByState({
    open: onClickInGallery
  }, mouseEvent);
}

export function onMouseDown(event: MouseEvent | TouchEvent): void {
  dispatchByState({
    hover: onMouseDownOutsideGallery,
    idle: onMouseDownOutsideGallery,
    open: onMouseDownInGallery
  }, new EnhancedMouseEvent(event));
}

export function onContextMenu(mouseEvent: MouseEvent): void {
  dispatchByState({
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
  if (mouseEvent.leftClick && mouseEvent.thumb !== null && !mouseEvent.ctrlKey) {
    mouseEvent.originalEvent.preventDefault();
    GalleryOpenCloseFlow.open(mouseEvent.thumb);
    return;
  }

  if (mouseEvent.middleClick && mouseEvent.thumb === null && !clickedInteractiveOverlay(mouseEvent)) {
    mouseEvent.originalEvent.preventDefault();
    GalleryOpenCloseFlow.toggleEnlargeOnHover();
  }
}

function clickedInteractiveOverlay(mouseEvent: EnhancedMouseEvent): boolean {
  const target = mouseEvent.originalEvent.target;
  return target instanceof HTMLElement && target.closest(".post-overlay") !== null;
}

function onMouseDownInGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.ctrlKey || GalleryView.overGalleryMenu(mouseEvent.originalEvent)) {
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
