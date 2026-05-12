import * as GalleryDesktopMenu from "./shell/desktop_menu";
import * as GalleryPresenter from "./presentation/gallery_presenter";
import * as GalleryUi from "./shell/ui";
import { GalleryRoot, mountGallery, toggleGalleryVisibility } from "./shell/shell";
import GALLERY_CSS from "../../../assets/css/gallery.css";
import { GalleryMenuAction } from "../../../types/ui";
import { ON_DESKTOP_DEVICE } from "../../../lib/environment/environment";
import { getAllContentThumbs } from "../../../lib/dom/content_thumb";
import { insertStyle } from "../../../lib/dom/injector";
export { overGalleryMenu } from "./view_utils";

export interface GalleryViewCallbacks {
  onMenuAction: (action: GalleryMenuAction) => void;
}

export function present(thumb: HTMLElement): void {
  display(thumb);
  GalleryUi.updateUiInGallery(thumb);
}

export function display(thumb: HTMLElement): void {
  toggleGalleryVisibility(true);
  GalleryPresenter.show(thumb);
  GalleryUi.show();
  GalleryPresenter.toggleZoom(false);
}

export function hide2(): void {
  toggleGalleryVisibility(false);
  GalleryPresenter.hide();
  GalleryUi.showScrollbar();
}

export function show(thumb: HTMLElement): void {
  GalleryPresenter.show(thumb);
  GalleryUi.enterGallery(thumb);
  toggleGalleryVisibility(true);
}

export function hide(): void {
  GalleryPresenter.hide();
  GalleryUi.exitGallery();
  toggleGalleryVisibility(false);
  toggleZoomCursor(false);
  setTimeout(() => {
    GalleryPresenter.upscaleCachedThumbs();
  }, 250);
}

export function setup(viewCallbacks: GalleryViewCallbacks): void {
  insertStyle(GALLERY_CSS);
  mountGallery();
  GalleryUi.setup();

  if (ON_DESKTOP_DEVICE) {
    GalleryDesktopMenu.setup(viewCallbacks.onMenuAction);
  }
}

export { onMouseMove as onDesktopMenuMouseMove, onMouseOver as onDesktopMenuMouseOver } from "./shell/desktop_menu";

export function toggleZoomCursor(value: boolean): void {
  GalleryUi.toggleZoomCursor(value);
  GalleryPresenter.toggleZoomCursor(value);
}

export * from "./presentation/gallery_presenter";
export * from "./shell/ui";
export const handleMouseMoveInGallery = (): void => GalleryUi.toggleCursor(true);
export const presetAllCanvasDimensions = (): void => GalleryPresenter.presetCanvasDimensions(getAllContentThumbs());
export const appendToGallery = (element: HTMLElement): HTMLElement => GalleryRoot.appendChild(element);
