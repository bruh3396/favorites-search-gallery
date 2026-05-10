import * as GalleryClickFlow from "./click_flow";
import * as GalleryModel from "../model/gallery_model";
import * as GalleryStateFlow from "./state_flow";
import * as GalleryView from "../view/gallery_view";
import { DomEvents } from "../../../lib/communication/dom_events";
import { EnhancedMouseEvent } from "../../../lib/dom/input_types";
import { executeByGalleryState } from "./state_executor";
import { throttle } from "../../../lib/core/scheduling/rate_limiting";

export const onMouseMove = throttle<MouseEvent>(() => {
  executeByGalleryState({
    gallery: GalleryView.handleMouseMoveInGallery
  });
}, 250);

export function onClick(mouseEvent: MouseEvent): void {
  executeByGalleryState({
    gallery: onClickInGallery
  }, mouseEvent);
}

export function onMouseDown(event: MouseEvent | TouchEvent): void {
  executeByGalleryState({
    hover: onMouseDownOutsideGallery,
    idle: onMouseDownOutsideGallery,
    gallery: onMouseDownInGallery
  }, new EnhancedMouseEvent(event));
}

export function onContextMenu(mouseEvent: MouseEvent): void {
  executeByGalleryState({
    gallery: onContextMenuInGallery
  }, mouseEvent);
}

export function toggleGalleryImageZoom(value: undefined | boolean = undefined): boolean {
  const zoomedIn = GalleryView.toggleZoom(value);

  DomEvents.document.wheel.toggle(!zoomedIn);
  return zoomedIn;
}

function onClickInGallery(mouseEvent: MouseEvent): void {
  if (mouseEvent.ctrlKey) {
    GalleryModel.openOriginalInNewTab();
  }
}

function onMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.leftClick && mouseEvent.thumb !== null && !mouseEvent.ctrlKey) {
    mouseEvent.originalEvent.preventDefault();
    GalleryStateFlow.enterGallery(mouseEvent.thumb);
    return;
  }

  if (mouseEvent.middleClick && mouseEvent.thumb === null) {
    mouseEvent.originalEvent.preventDefault();
    GalleryStateFlow.toggleEnlargeOnHover();
  }
}

function onMouseDownInGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.ctrlKey || GalleryView.overGalleryMenu(mouseEvent.originalEvent)) {
    return;
  }

  if (mouseEvent.shiftKey) {
    if (GalleryClickFlow.toggleGalleryImageZoom()) {
      GalleryView.zoomToPoint(mouseEvent.originalEvent.x, mouseEvent.originalEvent.y);
    }
    return;
  }
  const zoomedIn = mouseEvent.originalEvent.target instanceof HTMLElement && mouseEvent.originalEvent.target.closest(".zoomed-in") !== null;

  if (mouseEvent.leftClick && !zoomedIn && !GalleryModel.isViewingVideo()) {
    GalleryStateFlow.exitGallery();
    return;
  }

  if (mouseEvent.rightClick) {
    return;
  }

  if (mouseEvent.middleClick) {
    GalleryModel.openPostInNewTab();
  }
}

function onContextMenuInGallery(mouseEvent: MouseEvent): void {
  mouseEvent.preventDefault();
  GalleryStateFlow.exitGallery();
}
