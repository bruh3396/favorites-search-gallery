import { GalleryVideoRenderer, setupVideoRenderer } from "@/features/gallery/view/rendering/video/renderer";
import { isGif, isVideo } from "@/lib/media/type_predicates";
import { removeDataset, setDataset } from "@/utils/dom/attribute";
import { BoundaryEdge } from "@/types/boundary";
import { GalleryGifRenderer } from "@/features/gallery/view/rendering/gif/renderer";
import { GalleryImageRenderer } from "@/features/gallery/view/rendering/image/renderer";
import { GalleryRenderer } from "@/features/gallery/types/gallery_types";
import { forceReflow } from "@/utils/dom/element";

const renderers = [GalleryImageRenderer, GalleryVideoRenderer, GalleryGifRenderer];

export function setup(root: HTMLElement, onVideoEnded: () => void, onVideoDoubleClicked: (event: MouseEvent) => void): void {
  renderers.forEach(r => root.appendChild(r.root));
  setupVideoRenderer(onVideoEnded, onVideoDoubleClicked);
}

export function render(thumb: HTMLElement): void {
  hide();
  resolve(thumb).render(thumb);
}

export function nudge(thumb: HTMLElement, direction: BoundaryEdge): void {
  const { root } = resolve(thumb);

  removeDataset(root, "nudge");
  forceReflow(root);
  setDataset(root, "nudge", direction);
}

export const hide = (): void => renderers.forEach(r => r.hide());
export const cache = (thumbs: HTMLElement[]): void => renderers.forEach(r => r.cache(thumbs));
export const clearCache = (): void => renderers.forEach(r => r.clearCache());

export { cache as cacheImages, reupscaleCachedThumbs, upscale, correctOrientation, downscaleAll, toggleZoom, toggleZoomCursor, upscaleCachedThumbs, zoomToPoint } from "@/features/gallery/view/rendering/image/renderer";
export { toggleVideoLooping, restartVideo, toggleVideoPause, toggleVideoMute } from "@/features/gallery/view/rendering/video/renderer";

const resolve = (thumb: HTMLElement): GalleryRenderer => (isVideo(thumb) ? GalleryVideoRenderer : isGif(thumb) ? GalleryGifRenderer : GalleryImageRenderer);
