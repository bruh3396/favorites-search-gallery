import * as GalleryDesktopMenu from "@/features/gallery/view/shell/desktop_menu";
import * as GalleryRenderer from "@/features/gallery/view/rendering/gallery_renderer";
import * as GalleryShell from "@/features/gallery/view/shell/shell";
import * as GalleryUi from "@/features/gallery/view/shell/ui";
import GALLERY_CSS from "@/assets/css/gallery/gallery.css";
import { GalleryViewDependencies } from "@/features/gallery/types/gallery_types";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { insertStyle } from "@/utils/browser/injector";

export function setup(dependencies: GalleryViewDependencies): void {
  insertStyle(GALLERY_CSS);
  GalleryShell.mountGallery();
  GalleryUi.setup(GalleryShell.GalleryRoot);
  GalleryRenderer.setup(GalleryShell.GalleryRoot, dependencies.onVideoEnded, dependencies.onVideoDoubleClicked, dependencies.onVolumeChanged);

  if (ON_DESKTOP_DEVICE) {
    GalleryDesktopMenu.setup(dependencies.onMenuAction);
  }
}

export function open(thumb: HTMLElement): void {
  GalleryShell.GalleryRoot.toggleAttribute("data-visible", true);
  GalleryRenderer.toggleUpscaler(true);
  GalleryUi.open(thumb);
}

export function close(): void {
  GalleryRenderer.toggleUpscaler(false);
  GalleryShell.GalleryRoot.toggleAttribute("data-visible", false);
  GalleryRenderer.hide();
  GalleryUi.close();
  GalleryRenderer.upscaleCachedThumbs();
}

export function display(thumb: HTMLElement): void {
  GalleryRenderer.render(thumb);
  GalleryUi.update(thumb);
}

export function showPreview(thumb: HTMLElement): void {
  GalleryShell.GalleryRoot.toggleAttribute("data-visible", true);
  GalleryRenderer.render(thumb);
  GalleryRenderer.toggleZoom(false);
  GalleryUi.toggleScrollbar(false);
}

export function hidePreview(): void {
  GalleryShell.GalleryRoot.toggleAttribute("data-visible", false);
  GalleryRenderer.hide();
  GalleryUi.toggleScrollbar(true);
}

export function toggleZoomCursor(value: boolean): void {
  GalleryUi.toggleZoomCursor(value);
  GalleryRenderer.toggleZoomCursor(value);
}

export { nudge, cache, toggleZoom, zoomToPoint, cacheImages, upscale, upscaleCachedThumbs, downscaleAll, reupscaleCachedThumbs, correctOrientation, toggleVideoLooping, restartVideo, toggleVideoPause, setVideoMuted } from "@/features/gallery/view/rendering/gallery_renderer";
export { reveal as revealMenu, togglePersistence as toggleMenuPersistence, setPinned as setMenuPinned, setDockedLeft as setMenuDockedLeft } from "@/features/gallery/view/shell/desktop_menu";
export { toggleCursor, setBackgroundOpacity, showAddedFavoriteStatus, showRemovedFavoriteStatus } from "@/features/gallery/view/shell/ui";
export const showCursor = (): void => GalleryUi.toggleCursor(true);
export const appendToGallery = (element: HTMLElement): HTMLElement => GalleryShell.GalleryRoot.appendChild(element);
