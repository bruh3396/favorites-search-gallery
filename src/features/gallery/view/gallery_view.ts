import * as GalleryDesktopMenu from "./shell/desktop_menu";
import * as GalleryPresenter from "./presentation/presenter";
import * as GalleryUi from "./shell/ui";
import { GalleryRoot, mountGallery, toggleGalleryVisibility } from "./shell/shell";
import GALLERY_CSS from "../../../assets/css/gallery.css";
import { ON_DESKTOP_DEVICE } from "../../../lib/environment/environment";
import { getAllContentThumbs } from "../../../lib/dom/content_thumb";
import { insertStyle } from "../../../lib/dom/injector";
export { overGalleryMenu } from "./view_utils";

export function present(thumb: HTMLElement): void {
  display(thumb);
  GalleryUi.updateUiInGallery(thumb);
}

export function display(thumb: HTMLElement): void {
  toggleGalleryVisibility(true);
  GalleryPresenter.present(thumb);
  GalleryUi.show();
  GalleryPresenter.toggleZoom(false);
}

export function hide(): void {
  toggleGalleryVisibility(false);
  GalleryPresenter.hide();
  GalleryUi.hide();
}

export function enterGallery(thumb: HTMLElement): void {
  GalleryPresenter.present(thumb);
  GalleryUi.enterGallery(thumb);
  toggleGalleryVisibility(true);
}

export function exitGallery(): void {
  GalleryPresenter.hide();
  GalleryUi.exitGallery();
  toggleGalleryVisibility(false);
  toggleZoomCursor(false);
  setTimeout(() => {
    GalleryPresenter.upscaleCachedThumbs();
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
  GalleryPresenter.toggleZoomCursor(value);
}

export * from "./presentation/presenter";
export * from "./shell/ui";
export const handleMouseMoveInGallery = (): void => GalleryUi.toggleCursor(true);
export const presetAllCanvasDimensions = (): void => GalleryPresenter.presetCanvasDimensions(getAllContentThumbs());
export const appendToGallery = (element: HTMLElement): HTMLElement => GalleryRoot.appendChild(element);
