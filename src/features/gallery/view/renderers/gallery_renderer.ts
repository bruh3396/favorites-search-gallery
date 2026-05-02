// gallery_renderer.ts
import { isGif, isVideo } from "../../../../lib/media_resolver";
import { GalleryAbstractController } from "./gallery_abstract_controller";
import { GalleryGifController } from "./gif/gallery_gif_controller";
import { GalleryImageController } from "./image/controller/gallery_image_controller";
import { GalleryVideoController } from "./video/gallery_video_controller";

const controllers = [GalleryImageController, GalleryVideoController, GalleryGifController];

function getController(thumb: HTMLElement): GalleryAbstractController {
  return isVideo(thumb) ? GalleryVideoController : isGif(thumb) ? GalleryGifController : GalleryImageController;
}

export function render(thumb: HTMLElement): void {
  hideAll();
  getController(thumb).render(thumb);
}

export function hideAll(): void {
  controllers.forEach(controller => controller.hide());
}

export function exitGallery(): void {
  hideAll();
  GalleryImageController.exitGallery();
}

export function preloadContentInGallery(thumbs: HTMLElement[]): void {
  controllers.forEach(controller => controller.preload(thumbs));
}

export function handlePageChange(): void {
  controllers.forEach(controller => controller.handlePageChange());
}

export function handlePageChangeInGallery(): void {
  controllers.forEach(controller => controller.handlePageChangeInGallery());
}

export const preloadContentOutOfGallery = (thumbs: HTMLElement[]): void => GalleryImageController.preload(thumbs);
export const handleFavoritesAddedToCurrentPage = (thumbs: HTMLElement[]): void => GalleryImageController.handleFavoritesAddedToCurrentPage(thumbs);
export const toggleVideoLooping = (value: boolean): void => GalleryVideoController.toggleVideoLooping(value);
export const restartVideo = (): void => GalleryVideoController.restartVideo();
export const toggleVideoPause = (): void => GalleryVideoController.toggleVideoPause();
export const toggleVideoMute = (): void => GalleryVideoController.toggleVideoMute();
export const toggleZoom = (value: boolean | undefined): boolean => GalleryImageController.toggleZoom(value);
export const toggleZoomCursor = (value: boolean): void => GalleryImageController.toggleZoomCursor(value);
export const zoomToPoint = (x: number, y: number): void => GalleryImageController.zoomToPoint(x, y);
export const correctOrientation = (): void => GalleryImageController.correctOrientation();
export const downscaleAll = (): void => GalleryImageController.downscaleAll();
export const upscaleCachedThumbs = (): Promise<void> => GalleryImageController.upscaleCachedThumbs();
