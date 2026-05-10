import { isGif, isVideo } from "../../../../lib/media/media_type_guards";
import { GalleryAbstractController } from "./abstract_controller";
import { GalleryGifController } from "./gif/gif_controller";
import { GalleryImageController } from "./image/controller/image_controller";
import { GalleryVideoController } from "./video/video_controller";

const controllers = [GalleryImageController, GalleryVideoController, GalleryGifController];

function getController(thumb: HTMLElement): GalleryAbstractController {
  return isVideo(thumb) ? GalleryVideoController : isGif(thumb) ? GalleryGifController : GalleryImageController;
}

export function render(thumb: HTMLElement): void {
  hideAll();
  getController(thumb).render(thumb);
}

export function exitGallery(): void {
  hideAll();
  GalleryImageController.exitGallery();
}

export const hideAll = (): void => controllers.forEach(controller => controller.hide());
export const preloadContentInGallery = (thumbs: HTMLElement[]): void => controllers.forEach(controller => controller.preload(thumbs));
export const handlePageChange = (): void => controllers.forEach(controller => controller.handlePageChange());
export const handlePageChangeInGallery = (): void => controllers.forEach(controller => controller.handlePageChangeInGallery());
export const preloadContentOutOfGallery = (thumbs: HTMLElement[]): Promise<void> => GalleryImageController.preload(thumbs);
export const presetCanvasDimensions = (thumbs: HTMLElement[]): void => GalleryImageController.presetCanvasDimensions(thumbs);
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
