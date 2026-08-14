import { isGif, isVideo } from "@/lib/media/type_predicates";
import { removeDataset, setDataset } from "@/utils/dom/dataset";
import { BoundaryEdge } from "@/types/boundary";
import { GalleryGifRenderer } from "@/features/gallery/view/rendering/gif/renderer";
import { GalleryImageRenderer } from "@/features/gallery/view/rendering/image/renderer";
import { GalleryRenderer } from "@/features/gallery/types/gallery_types";
import { GalleryVideoRenderer } from "@/features/gallery/view/rendering/video/renderer";
import { forceReflow } from "@/utils/dom/element_factory";
import { toMediaItem } from "@/lib/thumb/item";

const renderers: GalleryRenderer[] = [GalleryImageRenderer, GalleryVideoRenderer, GalleryGifRenderer];

export function setup(root: HTMLElement, onVideoEnded: () => void, onVideoDoubleClicked: (event: MouseEvent) => void, onVolumeChanged: (volume: number) => void): void {
  renderers.forEach(r => root.appendChild(r.root));
  GalleryVideoRenderer.setup(onVideoEnded, onVideoDoubleClicked, onVolumeChanged);
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
export { toggleZoom, toggleZoomCursor, toggleUpscaler, zoomToPoint, cacheImages, upscale, upscaleCachedThumbs, downscaleAll, reupscaleCachedThumbs, correctOrientation } from "@/features/gallery/view/rendering/image/renderer";
export { toggleVideoLooping, restartVideo, toggleVideoPause, setVideoMuted } from "@/features/gallery/view/rendering/video/renderer";

function resolve(thumb: HTMLElement): GalleryRenderer {
  const item = toMediaItem(thumb);
  return isVideo(item) ? GalleryVideoRenderer : isGif(item) ? GalleryGifRenderer : GalleryImageRenderer;
}
