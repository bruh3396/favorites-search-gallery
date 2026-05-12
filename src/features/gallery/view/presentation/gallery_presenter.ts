import { isGif, isVideo } from "../../../../lib/media/media_type_guards";
import { GalleryAbstractRenderer } from "./abstract_renderer";
import { GalleryGifRenderer } from "./gif/renderer";
import { GalleryImageRenderer } from "./image/renderer";
import { GalleryVideoRenderer } from "./video/renderer";
import { VideoControllerCallbacks } from "../../types/gallery_types";

const renderers = [GalleryImageRenderer, GalleryVideoRenderer, GalleryGifRenderer];

export function show(thumb: HTMLElement): void {
  hide();
  getRenderer(thumb).render(thumb);
}

export const hide = (): void => renderers.forEach(p => p.hide());
export const preload = (thumbs: HTMLElement[]): void => renderers.forEach(p => p.preload(thumbs));
export const preloadImages = (thumbs: HTMLElement[]): Promise<void> => GalleryImageRenderer.preload(thumbs);

export const handlePageChange = (): void => renderers.forEach(p => p.handlePageChange());
export const handlePageChangeInGallery = (): void => renderers.forEach(p => p.handlePageChangeInGallery());
export const presetCanvasDimensions = (thumbs: HTMLElement[]): void => GalleryImageRenderer.presetCanvasDimensions(thumbs);
export const toggleVideoLooping = (value: boolean): void => GalleryVideoRenderer.toggleVideoLooping(value);
export const restartVideo = (): void => GalleryVideoRenderer.restartVideo();
export const toggleVideoPause = (): void => GalleryVideoRenderer.toggleVideoPause();
export const toggleVideoMute = (): void => GalleryVideoRenderer.toggleVideoMute();
export const toggleZoom = (value: boolean | undefined): boolean => GalleryImageRenderer.toggleZoom(value);
export const toggleZoomCursor = (value: boolean): void => GalleryImageRenderer.toggleZoomCursor(value);
export const zoomToPoint = (x: number, y: number): void => GalleryImageRenderer.zoomToPoint(x, y);
export const correctOrientation = (): void => GalleryImageRenderer.correctOrientation();
export const downscaleAll = (): void => GalleryImageRenderer.downscaleAll();
export const upscaleCachedThumbs = (): Promise<void> => GalleryImageRenderer.upscaleCachedThumbs();
export const setupVideoRenderer = (callbacks: VideoControllerCallbacks): void => GalleryVideoRenderer.setup(callbacks);

function getRenderer(thumb: HTMLElement): GalleryAbstractRenderer {
  return isVideo(thumb) ? GalleryVideoRenderer : isGif(thumb) ? GalleryGifRenderer : GalleryImageRenderer;
}
