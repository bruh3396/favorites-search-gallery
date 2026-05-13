import { isGif, isVideo } from "../../../../lib/media/media_type_guards";
import { GalleryGifRenderer } from "./gif/renderer";
import { GalleryImageRenderer } from "./image/renderer";
import { GalleryRenderer } from "../../types/gallery_types";
import { GalleryRoot } from "../shell/shell";
import { GalleryVideoRenderer } from "./video/renderer";

const renderers = [GalleryImageRenderer, GalleryVideoRenderer, GalleryGifRenderer];

renderers.forEach(r => GalleryRoot.appendChild(r.root));

export function render(thumb: HTMLElement): void {
  clear();
  resolve(thumb).render(thumb);
}

export function clear(): void {
  renderers.forEach(r => r.clear());
}

export const preload = (thumbs: HTMLElement[]): void => renderers.forEach(r => r.preload(thumbs));
export const reset = (): void => renderers.forEach(r => r.reset());
export const softReset = (): void => renderers.forEach(r => r.softReset());

export { preload as preloadImages, correctOrientation, downscaleAll, setCanvasDimensions, toggleZoom, toggleZoomCursor, upscaleCachedThumbs, zoomToPoint } from "./image/renderer";
export { setupVideoRenderer, toggleVideoLooping, restartVideo, toggleVideoPause, toggleVideoMute } from "./video/renderer";

const resolve = (thumb: HTMLElement): GalleryRenderer => (isVideo(thumb) ? GalleryVideoRenderer : isGif(thumb) ? GalleryGifRenderer : GalleryImageRenderer);
