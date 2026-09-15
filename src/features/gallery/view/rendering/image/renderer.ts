import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/upscalers/abstract_upscaler";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryImageCanvas } from "@/features/gallery/view/rendering/image/canvas";
import { GalleryImageLoader } from "@/features/gallery/view/rendering/image/loader";
import { GalleryMainThreadUpscaler } from "@/features/gallery/view/rendering/image/upscalers/main_thread_upscaler";
import { GalleryWorkerUpscalerWrapper } from "@/features/gallery/view/rendering/image/upscalers/worker_upscaler_wrapper";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { Renderer } from "@/features/gallery/types/gallery_types";
import { USING_FIREFOX } from "@/app/context/environment";
import { div } from "@/utils/browser/element";
import { isImageThumb } from "@/lib/ui/thumb/media_item";
import { waitForAllThumbsToLoad } from "@/app/layout/content_thumbs";
import { withTimeout } from "@/lib/async/scheduling";

export class GalleryImageRenderer implements Renderer {
  public readonly root = div();
  private readonly loader = new GalleryImageLoader((request) => this.onBitmapLoaded(request));
  private readonly upscaler: GalleryAbstractUpscaler = GalleryConfig.useOffscreenThumbUpscaler ? new GalleryWorkerUpscalerWrapper() : new GalleryMainThreadUpscaler();
  private readonly canvas = new GalleryImageCanvas();
  private activeId = "";

  constructor() {
    this.canvas.mount(this.root);
  }

  public render(thumb: HTMLElement): void {
    this.root.style.visibility = "visible";
    this.draw(thumb);
  }

  public hide(): void {
    this.root.style.visibility = "hidden";
    this.toggleZoomCursor(false);
    this.toggleZoom(false);

    if (USING_FIREFOX) {
      this.canvas.clear();
    }
  }

  public async cache(thumbs: HTMLElement[]): Promise<void> {
    await this.waitForAllThumbsToLoadWithTimeout();
    const rejected = this.loader
      .load(thumbs)
      .map((request) => request.thumb);
    const animated = thumbs.filter((thumb) => !isImageThumb(thumb));

    this.upscaler.upscaleAll(this.disposableRequests([...animated, ...rejected]));
  }

  public async upscale(thumbs: HTMLElement[]): Promise<void> {
    await this.waitForAllThumbsToLoadWithTimeout();
    this.upscaler.upscaleAll(this.disposableRequests(thumbs));
  }

  public reupscaleCachedThumbs(): void {
    this.upscaler.downscaleAll();
    setTimeout(() => this.upscaleCachedThumbs(), 10);
  }

  public toggleZoomCursor(value: boolean): boolean {
    return this.root.classList.toggle("gallery-image-frame--zooming", value);
  }

  public toggleZoom(value: boolean | undefined): boolean {
    return this.root.classList.toggle("gallery-image-frame--zoomed", value);
  }

  public zoomToPoint(x: number, y: number): void {
    return this.canvas.zoomToPoint(x, y);
  }

  public upscaleCachedThumbs(): void {
    this.upscaler.upscaleAll(this.loader.completedRequests());
  }

  public downscaleAll(): void {
    this.upscaler.downscaleAll();
  }

  public toggleUpscaler(value: boolean): void {
    this.upscaler.toggle(value);
  }

  public correctOrientation(): void {
    this.canvas.correctOrientation();
    const thumb = document.getElementById(this.activeId);

    if (thumb === null) {
      return;
    }
    const cached = this.loader.get(this.activeId);

    if (cached && cached.status === "complete") {
      this.draw(thumb);
    }
  }

  private draw(thumb: HTMLElement): void {
    this.activeId = thumb.id;
    const cached = this.loader.get(thumb.id);

    if (cached === undefined || cached.request.isIncomplete) {
      this.loader.loadImmediate(thumb);
      return;
    }
    this.canvas.draw(cached.request.bitmap);
  }

  private onBitmapLoaded(request: ImageRequest): void {
    this.upscaler.upscale(request);

    if (request.id === this.activeId) {
      this.draw(request.thumb);
    }
  }

  private disposableRequests(thumbs: HTMLElement[]): ImageRequest[] {
    return thumbs.map((thumb) => new ImageRequest(thumb, true));
  }

  private waitForAllThumbsToLoadWithTimeout(): Promise<unknown[]> {
    return withTimeout(waitForAllThumbsToLoad(), GalleryConfig.preloadWaitingTimeout);
  }
}
