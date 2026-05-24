import * as GalleryDesktopMenu from "./shell/desktop_menu";
import * as GalleryRenderer from "./rendering/gallery_renderer";
import * as GalleryUi from "./shell/ui";
import { GalleryRoot, mountGallery } from "./shell/shell";
import GALLERY_CSS from "../../../assets/css/gallery.css";
import { GalleryMenuAction } from "../../../types/ui";
import { ON_DESKTOP_DEVICE } from "../../../lib/environment/environment";
import { insertStyle } from "../../../utils/dom/injector";
export { overGalleryMenu } from "./view_utils";

export function open(thumb: HTMLElement): void {
  GalleryRoot.toggleAttribute("data-visible", true);
  GalleryUi.open(thumb);
}

export function close(): void {
  GalleryRoot.toggleAttribute("data-visible", false);
  GalleryRenderer.clear();
  GalleryUi.close();
  GalleryRenderer.upscaleCachedThumbs();
}

export function display(thumb: HTMLElement): void {
  GalleryRenderer.render(thumb);
  GalleryUi.update(thumb);
}

export function displayPreview(thumb: HTMLElement): void {
  GalleryRoot.toggleAttribute("data-visible", true);
  GalleryRenderer.render(thumb);
  GalleryUi.toggleScrollbar(false);
  GalleryRenderer.toggleZoom(false);
}

export function hidePreview(): void {
  GalleryRoot.toggleAttribute("data-visible", false);
  GalleryRenderer.clear();
  GalleryUi.toggleScrollbar(true);
}

export function setup(
  onMenuAction: (action: GalleryMenuAction) => void,
  onVideoEnded: () => void,
  onVideoDoubleClicked: (event: MouseEvent) => void
): void {
  insertStyle(GALLERY_CSS);
  mountGallery();
  GalleryUi.setup();
  GalleryRenderer.setupVideoRenderer({ onVideoEnded, onVideoDoubleClicked });

  if (ON_DESKTOP_DEVICE) {
    GalleryDesktopMenu.setup(onMenuAction);
  }
}

export function toggleZoomCursor(value: boolean): void {
  GalleryUi.toggleZoomCursor(value);
  GalleryRenderer.toggleZoomCursor(value);
}

export * from "./rendering/gallery_renderer";
export { onMouseMove as onDesktopMenuMouseMove, onMouseOver as onDesktopMenuMouseOver } from "./shell/desktop_menu";
export { showAddedFavoriteStatus, showRemovedFavoriteStatus, toggleBackgroundOpacity, updateBackgroundOpacity, toggleCursor} from "./shell/ui";
export const showCursor = (): void => GalleryUi.toggleCursor(true);
export const appendToGallery = (element: HTMLElement): HTMLElement => GalleryRoot.appendChild(element);
