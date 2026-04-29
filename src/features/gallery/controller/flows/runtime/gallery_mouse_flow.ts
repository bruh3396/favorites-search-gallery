import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryNavigationFlow from "./gallery_navigation_flow";
import * as GalleryPreloadFlow from "./gallery_preload_flow";
import * as GalleryStateFlow from "./gallery_state_flow";
import * as GalleryView from "../../../view/gallery_view";
import * as GalleryZoomFlow from "./gallery_zoom_flow";
import { EnhancedMouseEvent, EnhancedWheelEvent } from "../../../../../lib/dom/input_types";
import { ON_FAVORITES_PAGE } from "../../../../../lib/environment/environment";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";
import { overGalleryMenu } from "../../../view/gallery_view_utils";
import { throttle } from "../../../../../lib/core/scheduling/rate_limiting";

function onMouseOverWhileHoverEnabled(thumb: HTMLElement | null): void {
  if (thumb === null) {
    GalleryView.hide();
    return;
  }
  GalleryView.display(thumb);

  if (ON_FAVORITES_PAGE) {
    GalleryPreloadFlow.preloadContentOutsideGalleryAround(thumb);
  }
}

function onMouseOverWhileIdle(thumb: HTMLElement | null): void {
  if (thumb === null || !ON_FAVORITES_PAGE) {
    return;
  }
  GalleryPreloadFlow.preloadContentOutsideGalleryAround(thumb);
}

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

function onWheelWhileHoverEnabled(wheelEvent: EnhancedWheelEvent): void {
  GalleryView.updateBackgroundOpacity(wheelEvent.originalEvent);
}

function onWheelInGallery(wheelEvent: EnhancedWheelEvent): void {
  if (!wheelEvent.originalEvent.shiftKey && !wheelEvent.originalEvent.ctrlKey) {
    GalleryNavigationFlow.navigate(wheelEvent.direction);
  }
}

export const onMouseMove = throttle<MouseEvent>(() => {
  executeFunctionBasedOnGalleryState({
    gallery: GalleryView.handleMouseMoveInGallery
  });
}, 250);

export function onMouseOver(mouseEvent: EnhancedMouseEvent): void {
  executeFunctionBasedOnGalleryState({
    hover: onMouseOverWhileHoverEnabled,
    idle: onMouseOverWhileIdle
  }, mouseEvent.thumb);
}

export function onClick(mouseEvent: MouseEvent): void {
  executeFunctionBasedOnGalleryState({
    gallery: onClickInGallery
  }, mouseEvent);
}

export function onMouseDown(event: MouseEvent | TouchEvent): void {
  executeFunctionBasedOnGalleryState({
    hover: onMouseDownOutsideGallery,
    idle: onMouseDownOutsideGallery,
    gallery: onMouseDownInGallery
  }, new EnhancedMouseEvent(event));
}

export function onContextMenu(mouseEvent: MouseEvent): void {
  executeFunctionBasedOnGalleryState({
    gallery: onContextMenuInGallery
  }, mouseEvent);
}

export function onWheel(wheelEvent: EnhancedWheelEvent): void {
  executeFunctionBasedOnGalleryState({
    hover: onWheelWhileHoverEnabled,
    gallery: onWheelInGallery
  }, wheelEvent);
}
