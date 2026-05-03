import * as GalleryModel from "../model/gallery_model";
import * as GalleryStateFlow from "./gallery_state_flow";
import * as GalleryView from "../view/gallery_view";
import * as GalleryZoomFlow from "./gallery_zoom_flow";
import { EnhancedMouseEvent } from "../../../lib/dom/input_types";
import { executeByGalleryState } from "./gallery_state_executor";
import { overGalleryMenu } from "../view/gallery_view_utils";
import { throttle } from "../../../lib/core/scheduling/rate_limiting";

function onMouseDownInGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.ctrlKey || overGalleryMenu(mouseEvent.originalEvent)) {
    return;
  }

  if (mouseEvent.shiftKey) {
    if (GalleryZoomFlow.toggleGalleryImageZoom()) {
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

function onMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.leftClick && mouseEvent.thumb !== null && !mouseEvent.ctrlKey) {
    mouseEvent.originalEvent.preventDefault();
    GalleryStateFlow.enterGallery(mouseEvent.thumb);
    return;
  }

  if (mouseEvent.middleClick && mouseEvent.thumb === null) {
    mouseEvent.originalEvent.preventDefault();
    GalleryStateFlow.toggleShowingContentOnHover();
  }
}

function onClickInGallery(mouseEvent: MouseEvent): void {
  if (mouseEvent.ctrlKey) {
    GalleryModel.openOriginalInNewTab();
  }
}

function onContextMenuInGallery(mouseEvent: MouseEvent): void {
  mouseEvent.preventDefault();
  GalleryStateFlow.exitGallery();
}

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
