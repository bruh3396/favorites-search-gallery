import { isGif, isVideo } from "../../../../utils/content/content_type";
import { GalleryBaseRenderer } from "./gallery_base_renderer";
import { GalleryGifRenderer } from "./gif/gallery_gif_renderer";
import { GalleryImageRenderer } from "./image/gallery_image_renderer";
import { GalleryVideoRenderer } from "./video/gallery_video_renderer";

function getRenderers(): GalleryBaseRenderer[] {
  return [GalleryImageRenderer, GalleryGifRenderer, GalleryVideoRenderer];
}

export function render(thumb: HTMLElement): void {
  switch (true) {
    case isVideo(thumb):
      return startRenderer(GalleryVideoRenderer, thumb);

    case isGif(thumb):
      return startRenderer(GalleryGifRenderer, thumb);

    default:
      return startRenderer(GalleryImageRenderer, thumb);
  }
}

function startRenderer(targetRenderer: GalleryBaseRenderer, thumb: HTMLElement): void {
  for (const renderer of getRenderers()) {
    if (renderer === targetRenderer) {
      renderer.display(thumb);
    } else {
      renderer.hide();
    }
  }
}

export function clear(): void {
  for (const renderer of getRenderers()) {
    renderer.hide();
  }
}

export function preloadContentOutOfGallery(thumbs: HTMLElement[]): void {
  GalleryImageRenderer.preload(thumbs);
}

export function preloadContentInGallery(thumbs: HTMLElement[]): void {
  for (const renderer of getRenderers()) {
    renderer.preload(thumbs);
  }
}

export function handlePageChange(): void {
  for (const renderer of getRenderers()) {
    renderer.handlePageChange();
  }
}

export function handlePageChangeInGallery(): void {
  for (const renderer of getRenderers()) {
    renderer.handlePageChangeInGallery();
  }
}

export function handleResultsAddedToCurrentPage(thumbs: HTMLElement[]): void {
  GalleryImageRenderer.handleResultsAddedToCurrentPage(thumbs);
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
