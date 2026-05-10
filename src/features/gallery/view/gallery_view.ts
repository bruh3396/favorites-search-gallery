import * as GalleryDesktopMenu from "./shell/desktop_menu";
import * as GalleryRenderer from "./renderers/renderer";
import * as GalleryUi from "./shell/ui";
import { GalleryRoot, mountGallery, toggleGalleryVisibility } from "./shell/shell";
import GALLERY_CSS from "../../../assets/css/gallery.css";
import { ON_DESKTOP_DEVICE } from "../../../lib/environment/environment";
import { getAllContentThumbs } from "../../../lib/dom/content_thumb";
import { insertStyle } from "../../../lib/dom/injector";
export { overGalleryMenu } from "./view_utils";

export function showContentInGallery(thumb: HTMLElement): void {
  display(thumb);
  GalleryUi.updateUiInGallery(thumb);
}

export function display(thumb: HTMLElement): void {
  toggleGalleryVisibility(true);
  GalleryRenderer.render(thumb);
  GalleryUi.show();
  GalleryRenderer.toggleZoom(false);
}

export function hide(): void {
  toggleGalleryVisibility(false);
  GalleryRenderer.hideAll();
  GalleryUi.hide();
}

export function enterGallery(thumb: HTMLElement): void {
  GalleryRenderer.render(thumb);
  GalleryUi.enterGallery(thumb);
  toggleGalleryVisibility(true);
}

export function exitGallery(): void {
  GalleryRenderer.exitGallery();
  GalleryUi.exitGallery();
  toggleGalleryVisibility(false);
  toggleZoomCursor(false);
  setTimeout(() => {
    GalleryRenderer.upscaleCachedThumbs();
  }, 250);
}

export function setupGalleryView(): void {
  insertStyle(GALLERY_CSS);
  mountGallery();
  GalleryUi.setupGalleryUi();

  if (ON_DESKTOP_DEVICE) {
    GalleryDesktopMenu.setupDesktopGalleryMenu();
  }
}

export function toggleZoomCursor(value: boolean): void {
  GalleryUi.toggleZoomCursor(value);
  GalleryRenderer.toggleZoomCursor(value);
}

export * from "./renderers/renderer";
export * from "./shell/ui";
export const handleMouseMoveInGallery = (): void => GalleryUi.toggleCursor(true);
export const presetAllCanvasDimensions = (): void => GalleryRenderer.presetCanvasDimensions(getAllContentThumbs());
export const appendToGallery = (element: HTMLElement): HTMLElement => GalleryRoot.appendChild(element);
