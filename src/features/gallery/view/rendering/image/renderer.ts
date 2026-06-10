import * as GalleryImageCanvas from "@/features/gallery/view/rendering/image/canvas";
import * as GalleryImageLoader from "@/features/gallery/view/rendering/image/loader";
import * as GalleryUpscaler from "@/features/gallery/view/rendering/image/upscalers/upscaler";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryRenderer } from "@/features/gallery/types/gallery_types";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { USING_FIREFOX } from "@/lib/environment";
import { isImage } from "@/lib/media/type_predicates";
import { waitForAllThumbsToLoad } from "@/app/layout/content_thumbs";
import { withTimeout } from "@/lib/async/timing";

const root = document.createElement("div");
let activeId = "";

GalleryImageLoader.setCompletionCallback(onBitmapLoaded);
GalleryImageCanvas.mount(root);

export const GalleryImageRenderer = {
  root,
  render,
  clear,
  preload,
  reset,
  softReset
} satisfies GalleryRenderer;

export const toggleZoomCursor = (value: boolean): boolean => root.classList.toggle("gallery-image-frame--zooming", value);
export const toggleZoom = (value: boolean | undefined): boolean => root.classList.toggle("gallery-image-frame--zoomed", value);
export const zoomToPoint = GalleryImageCanvas.zoomToPoint;
export const upscaleCachedThumbs = (): void => GalleryUpscaler.upscaleAll(GalleryImageLoader.completedRequests());
export const setCanvasDimensions = GalleryUpscaler.setCanvasDimensions;
export const downscaleAll = GalleryUpscaler.reset;

export function correctOrientation(): void {
  GalleryImageCanvas.correctOrientation();
  renderActiveThumb();
}

export async function preload(thumbs: HTMLElement[]): Promise<void> {
  const animated = thumbs.filter(thumb => !isImage(thumb));

  await waitForAllThumbsToLoadWithTimeout();
  GalleryImageLoader.load(thumbs);
  GalleryUpscaler.upscaleAll(disposableRequests(animated));
}

export async function upscale(thumbs: HTMLElement[]): Promise<void> {
  await waitForAllThumbsToLoadWithTimeout();
  GalleryUpscaler.upscaleAll(disposableRequests(thumbs));
}

function render(thumb: HTMLElement): void {
  root.style.visibility = "visible";
  draw(thumb);
}

function clear(): void {
  root.style.visibility = "hidden";
  toggleZoomCursor(false);
  toggleZoom(false);

  if (USING_FIREFOX) {
    GalleryImageCanvas.clear();
  }
}

function disposableRequests(thumbs: HTMLElement[]): ImageRequest[] {
  return thumbs.map(thumb => {
    const request = new ImageRequest(thumb);

    request.disposable = true;
    return request;
  });
}

function reset(): void {
  GalleryUpscaler.reset();
  GalleryImageLoader.clear();
}

function softReset(): void {
  GalleryUpscaler.reset();
  setTimeout(() => GalleryUpscaler.upscaleAll(GalleryImageLoader.completedRequests()), 10);
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

function waitForAllThumbsToLoadWithTimeout(): Promise<unknown[]> {
  return withTimeout(waitForAllThumbsToLoad(), GalleryConfig.preloadWaitingTimeout);
}
