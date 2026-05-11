import * as GalleryImageCanvas from "./canvas";
import * as GalleryImageLoader from "./loader";
import * as GalleryUpscaler from "./upscalers/upscaler";
import { GalleryAbstractRenderer } from "../abstract_renderer";
import { GalleryConfig } from "../../../../../config/gallery_config";
import { ImageRequest } from "../../../types/image_request";
import { USING_FIREFOX } from "../../../../../lib/environment/environment";
import { waitForAllThumbnailsToLoad } from "../../../../../lib/dom/content_thumb";
import { withTimeout } from "../../../../../lib/core/scheduling/promise";

class ImageRenderer extends GalleryAbstractRenderer {
  private activeId: string;

  constructor() {
    super();
    this.activeId = "";
    GalleryImageLoader.setCompletionCallback((r) => this.onBitmapLoaded(r));
    GalleryImageCanvas.mount(this.container);
  }

  public async preload(thumbs: HTMLElement[]): Promise<void> {
    await withTimeout(waitForAllThumbnailsToLoad(), GalleryConfig.preloadWaitingTimeout);
    GalleryImageLoader.preload(thumbs);
    GalleryUpscaler.upscaleAnimated(thumbs);
  }

  public handlePageChange(): void {
    GalleryImageLoader.clear();
    GalleryUpscaler.handlePageChange();
  }

  public handlePageChangeInGallery(): void {
    GalleryUpscaler.handlePageChange();
    setTimeout(() => this.upscaleCachedThumbs(), 10);
  }

  public hide(): void {
    super.hide();

    if (USING_FIREFOX) {
      GalleryImageCanvas.clear();
    }
  }
  public correctOrientation(): void {
    GalleryImageCanvas.correctOrientation();
    this.redisplayActiveThumb();
  }

  public toggleZoomCursor(value: boolean): void {
    this.container.classList.toggle("gallery-image-frame--zooming", value);
  }

  public toggleZoom(value: boolean | undefined): boolean {
    return this.container.classList.toggle("gallery-image-frame--zoomed", value);
  }

  public zoomToPoint = (x: number, y: number): void => GalleryImageCanvas.zoomToPoint(x, y);
  public upscaleCachedThumbs = (): Promise<void> => GalleryUpscaler.upscaleBatch(GalleryImageLoader.completedRequests());
  public presetCanvasDimensions = (thumbs: HTMLElement[]): void => GalleryUpscaler.presetCanvasDimensions(thumbs);
  public downscaleAll = (): void => GalleryUpscaler.handlePageChange();

  protected display(thumb: HTMLElement): void {
    this.activeId = thumb.id;
    const cached = GalleryImageLoader.get(thumb.id);

    if (cached === undefined || cached.request.isIncomplete) {
      GalleryImageLoader.loadImmediate(thumb);
      return;
    }
    GalleryImageCanvas.draw(cached.request.bitmap);
  }

  private onBitmapLoaded(request: ImageRequest): void {
    GalleryUpscaler.upscale(request);

    if (request.id === this.activeId) {
      this.display(request.thumb);
    }
  }

  private redisplayActiveThumb(): void {
    const thumb = document.getElementById(this.activeId);

    if (thumb === null) {
      return;
    }
    const cached = GalleryImageLoader.get(this.activeId);

    if (cached && cached.status === "complete") {
      this.display(thumb);
    }
  }
}

export const GalleryImageRenderer = new ImageRenderer();
