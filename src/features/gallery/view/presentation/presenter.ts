import { isGif, isVideo } from "../../../../lib/media/media_type_guards";
import { GalleryAbstractPresenter } from "./abstract_presenter";
import { GalleryGifPresenter } from "./gif/gif_presenter";
import { GalleryImagePresenter } from "./image/presenter/image_presenter";
import { GalleryVideoPresenter } from "./video/video_presenter";

const presenters = [GalleryImagePresenter, GalleryVideoPresenter, GalleryGifPresenter];

export function present(thumb: HTMLElement): void {
  hide();
  getPresenter(thumb).present(thumb);
}

export const hide = (): void => presenters.forEach(p => p.hide());
export const preloadMediaInGallery = (thumbs: HTMLElement[]): void => presenters.forEach(p => p.preload(thumbs));
export const handlePageChange = (): void => presenters.forEach(p => p.handlePageChange());
export const handlePageChangeInGallery = (): void => presenters.forEach(p => p.handlePageChangeInGallery());
export const preloadMediaOutsideGallery = (thumbs: HTMLElement[]): Promise<void> => GalleryImagePresenter.preload(thumbs);
export const presetCanvasDimensions = (thumbs: HTMLElement[]): void => GalleryImagePresenter.presetCanvasDimensions(thumbs);
export const toggleVideoLooping = (value: boolean): void => GalleryVideoPresenter.toggleVideoLooping(value);
export const restartVideo = (): void => GalleryVideoPresenter.restartVideo();
export const toggleVideoPause = (): void => GalleryVideoPresenter.toggleVideoPause();
export const toggleVideoMute = (): void => GalleryVideoPresenter.toggleVideoMute();
export const toggleZoom = (value: boolean | undefined): boolean => GalleryImagePresenter.toggleZoom(value);
export const toggleZoomCursor = (value: boolean): void => GalleryImagePresenter.toggleZoomCursor(value);
export const zoomToPoint = (x: number, y: number): void => GalleryImagePresenter.zoomToPoint(x, y);
export const correctOrientation = (): void => GalleryImagePresenter.correctOrientation();
export const downscaleAll = (): void => GalleryImagePresenter.downscaleAll();
export const upscaleCachedThumbs = (): Promise<void> => GalleryImagePresenter.upscaleCachedThumbs();

function getPresenter(thumb: HTMLElement): GalleryAbstractPresenter {
  return isVideo(thumb) ? GalleryVideoPresenter : isGif(thumb) ? GalleryGifPresenter : GalleryImagePresenter;
}
