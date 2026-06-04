import * as GalleryDesktopMenu from "@/features/gallery/view/shell/desktop_menu";
import * as GalleryRenderer from "@/features/gallery/view/rendering/gallery_renderer";
import * as GalleryShell from "@/features/gallery/view/shell/shell";
import * as GalleryUi from "@/features/gallery/view/shell/ui";
import GALLERY_CSS from "@/assets/css/gallery.css";
import { GalleryMenuAction } from "@/types/ui";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { insertStyle } from "@/utils/dom/injector";
export { overGalleryMenu } from "@/features/gallery/view/view_utils";

export function setup(
  onMenuAction: (action: GalleryMenuAction) => void,
  onVideoEnded: () => void,
  onVideoDoubleClicked: (event: MouseEvent) => void
): void {
  insertStyle(GALLERY_CSS);
  GalleryShell.mountGallery();
  GalleryUi.setup(GalleryShell.GalleryRoot);
  GalleryRenderer.setup(GalleryShell.GalleryRoot, { onVideoEnded, onVideoDoubleClicked });

  if (ON_DESKTOP_DEVICE) {
    GalleryDesktopMenu.setup(onMenuAction);
  }
}

export function open(thumb: HTMLElement): void {
  GalleryShell.GalleryRoot.toggleAttribute("data-visible", true);
  GalleryUi.open(thumb);
}

export function close(): void {
  GalleryShell.GalleryRoot.toggleAttribute("data-visible", false);
  GalleryRenderer.clear();
  GalleryUi.close();
  GalleryRenderer.upscaleCachedThumbs();
}

export function display(thumb: HTMLElement): void {
  GalleryRenderer.render(thumb);
  GalleryUi.update(thumb);
}

export function displayPreview(thumb: HTMLElement): void {
  GalleryShell.GalleryRoot.toggleAttribute("data-visible", true);
  GalleryRenderer.render(thumb);
  GalleryUi.toggleScrollbar(false);
  GalleryRenderer.toggleZoom(false);
}

export function hidePreview(): void {
  GalleryShell.GalleryRoot.toggleAttribute("data-visible", false);
  GalleryRenderer.clear();
  GalleryUi.toggleScrollbar(true);
}

export function toggleZoomCursor(value: boolean): void {
  GalleryUi.toggleZoomCursor(value);
  GalleryRenderer.toggleZoomCursor(value);
}

export * from "@/features/gallery/view/rendering/gallery_renderer";
export { onMouseMove as onDesktopMenuMouseMove, onMouseOver as onDesktopMenuMouseOver } from "@/features/gallery/view/shell/desktop_menu";
export { showAddedFavoriteStatus, showRemovedFavoriteStatus, toggleBackgroundOpacity, updateBackgroundOpacity, toggleCursor} from "@/features/gallery/view/shell/ui";
export const showCursor = (): void => GalleryUi.toggleCursor(true);
export const appendToGallery = (element: HTMLElement): HTMLElement => GalleryShell.GalleryRoot.appendChild(element);
