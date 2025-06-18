import * as GalleryModel from "../../../model/gallery_model";
import * as GalleryNavigationFlow from "./gallery_navigation_flow";
import * as GalleryPreloadFlow from "./gallery_preload_flow";
import * as GalleryStateFlow from "./gallery_state_flow";
import * as GalleryView from "../../../view/gallery_view";
import * as GalleryZoomFlow from "./gallery_zoom_flow";
import { FavoritesMouseEvent } from "../../../../../types/events/mouse_event";
import { FavoritesWheelEvent } from "../../../../../types/events/wheel_event";
import { executeFunctionBasedOnGalleryState } from "./gallery_runtime_flow_utils";
import { overGalleryMenu } from "../../../../../utils/dom/dom";
import { throttle } from "../../../../../utils/misc/async";

function onMouseOverWhileHoverEnabled(thumb: HTMLElement | null): void {
  if (thumb === null) {
    GalleryView.hide();
    return;
  }
  GalleryView.display(thumb);
  GalleryPreloadFlow.preloadVisibleContentAround(thumb);
}

function onMouseDownInGallery(mouseEvent: FavoritesMouseEvent): void {
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

function onMouseDownOutsideGallery(mouseEvent: FavoritesMouseEvent): void {
  if (mouseEvent.leftClick && mouseEvent.thumb !== null && !mouseEvent.ctrlKey) {
    mouseEvent.originalEvent.preventDefault();
    GalleryStateFlow.enterGallery(mouseEvent.thumb);
    return;
  }

  if (mouseEvent.middleClick && mouseEvent.thumb === null) {
    mouseEvent.originalEvent.preventDefault();
    GalleryStateFlow.toggleShowContentOnHover();
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

function onWheelWhileHoverEnabled(wheelEvent: FavoritesWheelEvent): void {
  GalleryView.updateBackgroundOpacity(wheelEvent.originalEvent);
}

function onWheelInGallery(wheelEvent: FavoritesWheelEvent): void {
  if (!wheelEvent.originalEvent.shiftKey) {
    GalleryNavigationFlow.navigate(wheelEvent.direction);
  }
}

export const onMouseMove = throttle<MouseEvent>(() => {
  executeFunctionBasedOnGalleryState({
    gallery: GalleryView.handleMouseMoveInGallery
  });
}, 250);

export function onMouseOver(mouseEvent: FavoritesMouseEvent): void {
  executeFunctionBasedOnGalleryState({
    hover: onMouseOverWhileHoverEnabled,
    idle: GalleryPreloadFlow.preloadVisibleContentAround
  }, mouseEvent.thumb);
}

export function onClick(mouseEvent: MouseEvent): void {
  executeFunctionBasedOnGalleryState({
    gallery: onClickInGallery
  }, mouseEvent);
}

export function onMouseDown(mouseEvent: MouseEvent): void {
  executeFunctionBasedOnGalleryState({
    hover: onMouseDownOutsideGallery,
    idle: onMouseDownOutsideGallery,
    gallery: onMouseDownInGallery
  }, new FavoritesMouseEvent(mouseEvent));
}

export function onContextMenu(mouseEvent: MouseEvent): void {
  executeFunctionBasedOnGalleryState({
    gallery: onContextMenuInGallery
  }, mouseEvent);
}

export function onWheel(wheelEvent: FavoritesWheelEvent): void {
  executeFunctionBasedOnGalleryState({
    hover: onWheelWhileHoverEnabled,
    gallery: onWheelInGallery
  }, wheelEvent);
}
