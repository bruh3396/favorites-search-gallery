import { GalleryVideoRenderer, setupVideoRenderer } from "@/features/gallery/view/rendering/video/renderer";
import { isGif, isVideo } from "@/lib/media/media_type_predicates";
import { GalleryGifRenderer } from "@/features/gallery/view/rendering/gif/renderer";
import { GalleryImageRenderer } from "@/features/gallery/view/rendering/image/renderer";
import { GalleryRenderer } from "@/features/gallery/types/gallery_types";

const renderers = [GalleryImageRenderer, GalleryVideoRenderer, GalleryGifRenderer];

export function setup(root: HTMLElement, onVideoEnded: () => void, onVideoDoubleClicked: (event: MouseEvent) => void): void {
  renderers.forEach(r => root.appendChild(r.root));
  setupVideoRenderer(onVideoEnded, onVideoDoubleClicked);
}

export function render(thumb: HTMLElement): void {
  clear();
  resolve(thumb).render(thumb);
}

export const clear = (): void => renderers.forEach(r => r.clear());
export const preload = (thumbs: HTMLElement[]): void => renderers.forEach(r => r.preload(thumbs));
export const reset = (): void => renderers.forEach(r => r.reset());
export const softReset = (): void => renderers.forEach(r => r.softReset());

export { preload as preloadImages, correctOrientation, downscaleAll, toggleZoom, toggleZoomCursor, upscaleCachedThumbs, zoomToPoint } from "@/features/gallery/view/rendering/image/renderer";
export { toggleVideoLooping, restartVideo, toggleVideoPause, toggleVideoMute } from "@/features/gallery/view/rendering/video/renderer";

const resolve = (thumb: HTMLElement): GalleryRenderer => (isVideo(thumb) ? GalleryVideoRenderer : isGif(thumb) ? GalleryGifRenderer : GalleryImageRenderer);
