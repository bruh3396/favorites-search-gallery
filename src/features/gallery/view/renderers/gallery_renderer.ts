import { isGif, isVideo } from "../../../../utils/content/content_type";
import { GalleryBaseRenderer } from "./gallery_base_renderer";
import { GalleryGifRenderer } from "./gif/gallery_gif_renderer";
import { GalleryImageRenderer } from "./image/gallery_image_renderer";
import { GalleryVideoRenderer } from "./video/gallery_video_renderer";

function getRenderers(): GalleryBaseRenderer[] {
  return [GalleryGifRenderer, GalleryVideoRenderer, GalleryImageRenderer];
}

export function render(thumb: HTMLElement): Promise<void> {
  if (isVideo(thumb)) {
    return startRenderer(GalleryVideoRenderer, thumb);
  }

  if (isGif(thumb)) {
    return startRenderer(GalleryGifRenderer, thumb);
  }
  return startRenderer(GalleryImageRenderer, thumb);
}

async function startRenderer(targetRenderer: GalleryBaseRenderer, thumb: HTMLElement): Promise<void> {
  const nonTargetRenderers = getRenderers().filter(r => r !== targetRenderer);
  const renderers = [targetRenderer, ...nonTargetRenderers];

  nonTargetRenderers.forEach(r => r.hide());

  for (const renderer of renderers) {
    const success = await renderer.display(thumb)
      .then(() => true)
      .catch(() => {
        renderer.hide();
        return false;
      });

    if (success) {
      return Promise.resolve();
    }
  }
  return Promise.reject(new Error("Could not display media"));
}

export function hide(): void {
  for (const renderer of getRenderers()) {
    renderer.hide();
  }
}

export function exitGallery(): void {
  getRenderers().forEach(renderer => renderer.hide());
  GalleryImageRenderer.exitGallery();
}

export function preloadContentOutOfGallery(thumbs: HTMLElement[]): void {
  GalleryImageRenderer.preload(thumbs);
}

export function preloadContentInGallery(thumbs: HTMLElement[]): void {
  getRenderers().forEach(renderer => renderer.preload(thumbs));
}

export function handlePageChange(): void {
  getRenderers().forEach(renderer => renderer.handlePageChange());
}

export function handlePageChangeInGallery(): void {
  getRenderers().forEach(renderer => renderer.handlePageChangeInGallery());
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
