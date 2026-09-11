import * as GalleryImageCanvas from "@/features/gallery/view/rendering/image/canvas";
import * as GalleryImageLoader from "@/features/gallery/view/rendering/image/loader";
import * as GalleryUpscaler from "@/features/gallery/view/rendering/image/upscalers/upscaler";
import { GalleryConfig } from "@/config/gallery_config";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { Renderer } from "@/features/gallery/types/gallery_types";
import { USING_FIREFOX } from "@/lib/environment";
import { div } from "@/utils/browser/element";
import { isImageThumb } from "@/lib/ui/thumb/media_item";
import { waitForAllThumbsToLoad } from "@/app/layout/content_thumbs";
import { withTimeout } from "@/lib/async/scheduling";

export class GalleryImageRenderer implements Renderer {
  public readonly root = div();
  private activeId = "";

  constructor() {
    GalleryImageLoader.setCompletionCallback((request) => this.onBitmapLoaded(request));
    GalleryImageCanvas.mount(this.root);
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
      GalleryImageCanvas.clear();
    }
  }

  public async cache(thumbs: HTMLElement[]): Promise<void> {
    await this.waitForAllThumbsToLoadWithTimeout();

    const rejected = GalleryImageLoader
      .load(thumbs)
      .map((request) => request.thumb);

    const animated = thumbs.filter((thumb) => !isImageThumb(thumb));

    GalleryUpscaler.upscaleAll(this.disposableRequests([...animated, ...rejected]));
  }

  public async upscale(thumbs: HTMLElement[]): Promise<void> {
    await this.waitForAllThumbsToLoadWithTimeout();
    GalleryUpscaler.upscaleAll(this.disposableRequests(thumbs));
  }

  public reupscaleCachedThumbs(): void {
    GalleryUpscaler.downscaleAll();
    setTimeout(() => this.upscaleCachedThumbs(), 10);
  }

  public toggleZoomCursor(value: boolean): boolean {
    return this.root.classList.toggle(
      "gallery-image-frame--zooming",
      value
    );
  }

  public toggleZoom(value: boolean | undefined): boolean {
    return this.root.classList.toggle(
      "gallery-image-frame--zoomed",
      value
    );
  }

  public zoomToPoint(x: number, y: number): void {
    return GalleryImageCanvas.zoomToPoint(x, y);
  }

  public upscaleCachedThumbs(): void {
    GalleryUpscaler.upscaleAll(GalleryImageLoader.completedRequests());
  }

  public downscaleAll(): void {
    GalleryUpscaler.downscaleAll();
  }

  public toggleUpscaler(value: boolean): void {
    GalleryUpscaler.toggleUpscaler(value);
  }

  public correctOrientation(): void {
    GalleryImageCanvas.correctOrientation();
    this.renderActiveThumb();
  }

  private draw(thumb: HTMLElement): void {
    this.activeId = thumb.id;
    const cached = GalleryImageLoader.get(thumb.id);

    if (cached === undefined || cached.request.isIncomplete) {
      GalleryImageLoader.loadImmediate(thumb);
      return;
    }
    GalleryImageCanvas.draw(cached.request.bitmap);
  }

  private onBitmapLoaded(request: ImageRequest): void {
    GalleryUpscaler.upscaleOne(request);

    if (request.id === this.activeId) {
      this.draw(request.thumb);
    }
  }

  private renderActiveThumb(): void {
    const thumb = document.getElementById(this.activeId);

    if (thumb === null) {
      return;
    }
    const cached = GalleryImageLoader.get(this.activeId);

    if (cached && cached.status === "complete") {
      this.draw(thumb);
    }
  }

  private disposableRequests(thumbs: HTMLElement[]): ImageRequest[] {
    return thumbs.map((thumb) => new ImageRequest(thumb, true));
  }

  private waitForAllThumbsToLoadWithTimeout(): Promise<unknown[]> {
    return withTimeout(
      waitForAllThumbsToLoad(),
      GalleryConfig.preloadWaitingTimeout
    );
  }
}
