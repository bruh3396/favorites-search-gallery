import * as GalleryFlows from "@/features/gallery/flows/flows";
import * as GalleryModel from "@/features/gallery/model/model";
import * as GalleryView from "@/features/gallery/view/view";
import { DomEvents } from "@/app/dom/events";
import { EnhancedMouseEvent } from "@/lib/input";
import { Preferences } from "@/app/context/preferences";
import { overGalleryMenu } from "@/features/gallery/dom_tweaks/menu";

export function handleClick(mouseEvent: EnhancedMouseEvent): void {
  GalleryFlows.Dispatch.run({
    open: openMediaOnCtrlClick
  }, mouseEvent.originalEvent);
}

export function handleMouseDown(event: EnhancedMouseEvent): void {
  GalleryFlows.Dispatch.run({
    preview: handleMouseDownOutsideGallery,
    idle: handleMouseDownOutsideGallery,
    open: handleMouseDownInGallery
  }, event);
}

export function handleContextMenu(mouseEvent: MouseEvent): void {
  GalleryFlows.Dispatch.run({
    open: closeOnContextMenu
  }, mouseEvent);
}

export function toggleGalleryImageZoom(value: undefined | boolean = undefined): boolean {
  const isZoomedIn = GalleryView.toggleZoom(value);

  DomEvents.document.wheel.toggle(!isZoomedIn);
  return isZoomedIn;
}

function openMediaOnCtrlClick(mouseEvent: MouseEvent): void {
  if (mouseEvent.ctrlKey) {
    GalleryModel.openMedia();
  }
}

function handleMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.leftClick && mouseEvent.thumb !== null && !mouseEvent.ctrlKey && !mouseEvent.shiftKey) {
    mouseEvent.originalEvent.preventDefault();
    GalleryFlows.OpenClose.open(mouseEvent.thumb);
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

function handleMouseDownInGallery(mouseEvent: EnhancedMouseEvent): void {
  if (mouseEvent.ctrlKey || overGalleryMenu(mouseEvent.originalEvent)) {
    return;
  }

  if (mouseEvent.shiftKey) {
    if (toggleGalleryImageZoom()) {
      GalleryView.zoomToPoint(mouseEvent.originalEvent.x, mouseEvent.originalEvent.y);
    }
    return;
  }
  const isZoomedIn = mouseEvent.originalEvent.target instanceof HTMLElement && mouseEvent.originalEvent.target.closest(".zoomed-in") !== null;

  if (mouseEvent.leftClick && !isZoomedIn && !GalleryModel.isViewingVideo()) {
    GalleryFlows.OpenClose.close();
    return;
  }

  if (mouseEvent.rightClick) {
    return;
  }

  if (mouseEvent.middleClick) {
    GalleryModel.openPost();
  }
}

function closeOnContextMenu(mouseEvent: MouseEvent): void {
  mouseEvent.preventDefault();
  GalleryFlows.OpenClose.close();
}
