import * as GalleryDesktopMenu from "@/features/gallery/view/shell/menu";
import * as GalleryShell from "@/features/gallery/view/shell/shell";
import * as GalleryUi from "@/features/gallery/view/shell/ui";
import { BoundaryEdge } from "@/types/boundary";
import GALLERY_CSS from "@/assets/css/gallery/gallery.css";
import { GalleryRenderer } from "@/features/gallery/view/rendering/gallery_renderer";
import { GalleryViewDependencies } from "@/features/gallery/types/gallery_types";
import { insertStyle } from "@/utils/browser/injector";

let renderer: GalleryRenderer;

export function setup(dependencies: GalleryViewDependencies): void {
  insertStyle(GALLERY_CSS);
  GalleryShell.mountGallery();
  GalleryUi.setup(GalleryShell.GalleryRoot);
  renderer = new GalleryRenderer(GalleryShell.GalleryRoot, dependencies.onVideoEnded, dependencies.onVideoDoubleClicked, dependencies.onVolumeChanged);
  GalleryDesktopMenu.setup(dependencies.onMenuAction);
}

export function open(thumb: HTMLElement): void {
  GalleryShell.GalleryRoot.toggleAttribute("data-visible", true);
  renderer.toggleUpscaler(true);
  GalleryUi.open(thumb);
}

export function close(): void {
  renderer.toggleUpscaler(false);
  GalleryShell.GalleryRoot.toggleAttribute("data-visible", false);
  renderer.hide();
  GalleryUi.close();
  renderer.upscaleCachedThumbs();
}

export function display(thumb: HTMLElement): void {
  renderer.render(thumb);
  GalleryUi.update(thumb);
}

export function showPreview(thumb: HTMLElement): void {
  GalleryShell.GalleryRoot.toggleAttribute("data-visible", true);
  renderer.render(thumb);
  renderer.toggleZoom(false);
  GalleryUi.toggleScrollbar(false);
}

export function hidePreview(): void {
  GalleryShell.GalleryRoot.toggleAttribute("data-visible", false);
  renderer.hide();
  GalleryUi.toggleScrollbar(true);
}

export function toggleZoomCursor(value: boolean): void {
  GalleryUi.toggleZoomCursor(value);
  renderer.toggleZoomCursor(value);
}

export const nudge = (thumb: HTMLElement, direction: BoundaryEdge): void => renderer.nudge(thumb, direction);
export const cache = (thumbs: HTMLElement[]): void => renderer.cache(thumbs);
export const toggleZoom = (value: boolean | undefined): boolean => renderer.toggleZoom(value);
export const zoomToPoint = (x: number, y:number): void => renderer.zoomToPoint(x, y);
export const cacheImages = (thumbs: HTMLElement[]): Promise<void> => renderer.cacheImages(thumbs);
export const upscale = (thumbs: HTMLElement[]): Promise<void> => renderer.upscale(thumbs);
export const upscaleCachedThumbs = (): void => renderer.upscaleCachedThumbs();
export const downscaleAll = (): void => renderer.downscaleAll();
export const reupscaleCachedThumbs = (): void => renderer.reupscaleCachedThumbs();
export const correctOrientation = (): void => renderer.correctOrientation();
export const toggleVideoLooping = (value: boolean): void => renderer.toggleVideoLooping(value);
export const restartVideo = (): void => renderer.restartVideo();
export const toggleVideoPause = (): void => renderer.toggleVideoPause();
export const setVideoMuted = (muted: boolean): void => renderer.setVideoMuted(muted);

export { reveal as revealMenu, togglePersistence as toggleMenuPersistence, setPinned as setMenuPinned, setDockedLeft as setMenuDockedLeft } from "@/features/gallery/view/shell/menu";
export { toggleCursor, setBackgroundOpacity, showAddedFavoriteStatus, showRemovedFavoriteStatus } from "@/features/gallery/view/shell/ui";
export const showCursor = (): void => GalleryUi.toggleCursor(true);
export const appendToGallery = (element: HTMLElement): HTMLElement => GalleryShell.GalleryRoot.appendChild(element);
