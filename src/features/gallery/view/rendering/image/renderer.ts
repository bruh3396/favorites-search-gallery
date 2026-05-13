import * as GalleryImageCanvas from "./canvas";
import * as GalleryImageLoader from "./loader";
import * as GalleryUpscaler from "./upscalers/upscaler";
import { GalleryConfig } from "../../../../../config/gallery_config";
import { GalleryRenderer } from "../../../types/gallery_types";
import { ImageRequest } from "../../../types/image_request";
import { USING_FIREFOX } from "../../../../../lib/environment/environment";
import { waitForAllThumbnailsToLoad } from "../../../../../lib/dom/content_thumb";
import { withTimeout } from "../../../../../lib/core/scheduling/promise";

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
export const upscaleCachedThumbs = (): Promise<void> => GalleryUpscaler.upscaleBatch(GalleryImageLoader.completedRequests());
export const setCanvasDimensions = GalleryUpscaler.setCanvasDimensions;
export const downscaleAll = GalleryUpscaler.reset;
export { preload };

export function correctOrientation(): void {
  GalleryImageCanvas.correctOrientation();
  renderActiveThumb();
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

async function preload(thumbs: HTMLElement[]): Promise<void> {
  await withTimeout(waitForAllThumbnailsToLoad(), GalleryConfig.preloadWaitingTimeout);
  GalleryImageLoader.preload(thumbs);
  GalleryUpscaler.upscaleAnimated(thumbs);
}

function reset(): void {
  GalleryUpscaler.reset();
  GalleryImageLoader.clear();
}

function softReset(): void {
  GalleryUpscaler.reset();
  setTimeout(() => GalleryUpscaler.upscaleBatch(GalleryImageLoader.completedRequests()), 10);
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
  GalleryUpscaler.upscale(request);

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
