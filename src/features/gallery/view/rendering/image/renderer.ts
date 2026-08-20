import * as GalleryImageCanvas from "@/features/gallery/view/rendering/image/canvas";
import * as GalleryImageLoader from "@/features/gallery/view/rendering/image/loader";
import * as GalleryUpscaler from "@/features/gallery/view/rendering/image/upscalers/upscaler";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryRenderer } from "@/features/gallery/types/gallery_types";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { USING_FIREFOX } from "@/lib/environment";
import { div } from "@/utils/browser/factory";
import { isImageThumb } from "@/lib/media/type_predicates";
import { waitForAllThumbsToLoad } from "@/app/layout/content_thumbs";
import { withTimeout } from "@/lib/async/scheduling";

const root = div();
let activeId = "";

GalleryImageLoader.setCompletionCallback(onBitmapLoaded);
GalleryImageCanvas.mount(root);

export const GalleryImageRenderer = {
  root,
  render,
  hide,
  cache: cacheImages
} satisfies GalleryRenderer;

export const toggleZoomCursor = (value: boolean): boolean => root.classList.toggle("gallery-image-frame--zooming", value);
export const toggleZoom = (value: boolean | undefined): boolean => root.classList.toggle("gallery-image-frame--zoomed", value);
export const zoomToPoint = GalleryImageCanvas.zoomToPoint;
export const upscaleCachedThumbs = (): void => GalleryUpscaler.upscaleAll(GalleryImageLoader.completedRequests());
export const downscaleAll = GalleryUpscaler.downscaleAll;
export const toggleUpscaler = GalleryUpscaler.toggleUpscaler;

export function correctOrientation(): void {
  GalleryImageCanvas.correctOrientation();
  renderActiveThumb();
}

export async function cacheImages(thumbs: HTMLElement[]): Promise<void> {
  await waitForAllThumbsToLoadWithTimeout();
  const rejected = GalleryImageLoader.load(thumbs).map(request => request.thumb);
  const animated = thumbs.filter(thumb => !isImageThumb(thumb));

  GalleryUpscaler.upscaleAll(disposableRequests([...animated, ...rejected]));
}

export async function upscale(thumbs: HTMLElement[]): Promise<void> {
  await waitForAllThumbsToLoadWithTimeout();
  GalleryUpscaler.upscaleAll(disposableRequests(thumbs));
}

export function reupscaleCachedThumbs(): void {
  GalleryUpscaler.downscaleAll();
  setTimeout(upscaleCachedThumbs, 10);
}

function render(thumb: HTMLElement): void {
  root.style.visibility = "visible";
  draw(thumb);
}

function hide(): void {
  root.style.visibility = "hidden";
  toggleZoomCursor(false);
  toggleZoom(false);

  if (USING_FIREFOX) {
    GalleryImageCanvas.clear();
  }
}

function draw(thumb: HTMLElement): void {
  activeId = thumb.id;
  const cached = GalleryImageLoader.get(thumb.id);

  if (cached === undefined || cached.request.isIncomplete) {
    GalleryImageLoader.loadImmediate(thumb);
    return;
  }
  GalleryImageCanvas.draw(cached.request.bitmap);
}

function onBitmapLoaded(request: ImageRequest): void {
  GalleryUpscaler.upscaleOne(request);

  if (request.id === activeId) {
    draw(request.thumb);
  }
}

function renderActiveThumb(): void {
  const thumb = document.getElementById(activeId);

  if (thumb === null) {
    return;
  }
  const cached = GalleryImageLoader.get(activeId);

  if (cached && cached.status === "complete") {
    draw(thumb);
  }
}

function disposableRequests(thumbs: HTMLElement[]): ImageRequest[] {
  return thumbs.map(thumb => new ImageRequest(thumb, true));
}

function waitForAllThumbsToLoadWithTimeout(): Promise<unknown[]> {
  return withTimeout(waitForAllThumbsToLoad(), GalleryConfig.preloadWaitingTimeout);
}
