import { isGif, isVideo } from "../../../../utils/content/content_type";
import { GalleryBaseRenderer } from "./gallery_base_renderer";
import { GalleryGifRenderer } from "./gif/gallery_gif_renderer";
import { GalleryImageRenderer } from "./image/gallery_image_renderer";
import { GalleryVideoRenderer } from "./video/gallery_video_renderer";

const RENDERERS = [GalleryGifRenderer, GalleryVideoRenderer, GalleryImageRenderer];

function getRenderer(thumb: HTMLElement): GalleryBaseRenderer {
  return isVideo(thumb) ? GalleryVideoRenderer : isGif(thumb) ? GalleryGifRenderer : GalleryImageRenderer;
}

export function render(thumb: HTMLElement): void {
  hide();
  getRenderer(thumb).display(thumb);
}

export function hide(): void {
  RENDERERS.forEach(renderer => renderer.hide());
}

export function exitGallery(): void {
  hide();
  GalleryImageRenderer.exitGallery();
}

export function preloadContentOutOfGallery(thumbs: HTMLElement[]): void {
  GalleryImageRenderer.preload(thumbs);
}

export function preloadContentInGallery(thumbs: HTMLElement[]): void {
  RENDERERS.forEach(renderer => renderer.preload(thumbs));
}

export function handlePageChange(): void {
  RENDERERS.forEach(renderer => renderer.handlePageChange());
}

export function handlePageChangeInGallery(): void {
  RENDERERS.forEach(renderer => renderer.handlePageChangeInGallery());
}

export function handleFavoritesAddedToCurrentPage(thumbs: HTMLElement[]): void {
  GalleryImageRenderer.handleFavoritesAddedToCurrentPage(thumbs);
}

export function toggleVideoLooping(value: boolean): void {
  GalleryVideoRenderer.toggleVideoLooping(value);
}

export function restartVideo(): void {
  GalleryVideoRenderer.restartVideo();
}

export function toggleVideoPause(): void {
  GalleryVideoRenderer.toggleVideoPause();
}

export function toggleVideoMute(): void {
  GalleryVideoRenderer.toggleVideoMute();
}

export function toggleZoom(value: boolean | undefined): boolean {
  return GalleryImageRenderer.toggleZoom(value);
}

export function toggleZoomCursor(value: boolean): void {
  GalleryImageRenderer.toggleZoomCursor(value);
}

export function zoomToPoint(x: number, y: number): void {
  GalleryImageRenderer.zoomToPoint(x, y);
}

export function correctOrientation(): void {
  GalleryImageRenderer.correctOrientation();
}

export function downscaleAll(): void {
  GalleryImageRenderer.downscaleAll();
}

export function upscaleCachedImageThumbs(): void {
  GalleryImageRenderer.upscaleCachedImageThumbs();
}
