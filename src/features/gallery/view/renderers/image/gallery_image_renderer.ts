import * as GalleryCanvas from "./gallery_canvas";
import * as GalleryImageCache from "./gallery_image_cache";
import { GalleryBaseRenderer } from "../gallery_base_renderer";
import { GalleryNormalThumbUpscaler } from "./upscalers/gallery_normal_thumbnail_upscaler";
import { GalleryOffscreenThumbnailUpscalerWrapper } from "./upscalers/gallery_offscreen_thumbnail_upscaler_wrapper";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { ImageRequest } from "../../../types/gallery_image_request";
import { ThrottledQueue } from "../../../../../lib/components/throttled_queue";
import { USING_FIREFOX } from "../../../../../lib/global/flags/intrinsic_flags";
import { UpscaleImageRequest } from "../../../types/gallery_upscale_image_request";

const UPSCALER = GallerySettings.useOffscreenThumbUpscaler ? new GalleryOffscreenThumbnailUpscalerWrapper() : new GalleryNormalThumbUpscaler();
const UPSCALE_QUEUE = new ThrottledQueue(20, !USING_FIREFOX);

class ImageRenderer extends GalleryBaseRenderer {
  public lastShownId: string;

  constructor() {
    super();
    GalleryImageCache.setupGalleryImageCache(this.onImageCreated.bind(this));
    GalleryCanvas.setupGalleryCanvas(this.container);
    this.lastShownId = "";
  }

  public display(thumb: HTMLElement): void {
    super.display(thumb);
    this.draw(thumb);
  }

  public preload(thumbs: HTMLElement[]): void {
    GalleryImageCache.cacheImages(thumbs);
  }

  public preloadOneImage(thumb: HTMLElement): void {
    GalleryImageCache.cacheSingleImage(thumb);
  }

  public async upscale(thumbs: HTMLElement[]): Promise<void> {
    for (const thumb of thumbs) {
      await UPSCALE_QUEUE.wait();
      UPSCALER.upscale(new UpscaleImageRequest(thumb));
    }
  }

  public handlePageChange(): void {
    GalleryImageCache.clear();
    UPSCALER.handlePageChange();
  }

  public handlePageChangeInGallery(): void {
    GalleryImageCache.clearAnimatedImages();
    setTimeout(() => {
      UPSCALER.handlePageChange();
      this.upscaleThumbsWithAvailableImages();
    }, 10);
  }

  public handleResultsAddedToCurrentPage(thumbs: HTMLElement[]): void {
    UPSCALER.presetCanvasDimensions(thumbs);
  }

  public upscaleThumbsWithAvailableImages(): void {
    GalleryImageCache.getImageRequests().forEach(request => UPSCALER.upscale(request));
  }

  public exitGallery(): void {
    if (GallerySettings.onlyCacheImagesInGallery) {
      GalleryImageCache.clear();
    }

    if (USING_FIREFOX) {
      GalleryCanvas.clear();
    }
  }

  public onImageCreated(request: ImageRequest): void {
    UPSCALER.upscale(request);

    if (request.id === this.lastShownId) {
      this.draw(request.thumb);
    }
  }

  public toggleZoom(value: boolean | undefined): boolean {
    return this.container.classList.toggle("zoomed-in", value);
  }

  public toggleZoomCursor(value: boolean): void {
    this.container.classList.toggle("zooming", value);
  }

  public zoomToPoint(x: number, y: number): void {
    GalleryCanvas.zoomToPoint(x, y);
  }

  public correctOrientation(): void {
    GalleryCanvas.correctOrientation();
    this.redrawOnOrientationChange();
  }

  private redrawOnOrientationChange(): void {
    const thumb = document.getElementById(this.lastShownId);

    if (thumb === null) {
      return;
    }
    const imageRequest = GalleryImageCache.getImageRequest(thumb);

    if (imageRequest === undefined || imageRequest.isIncomplete) {
      return;
    }
    this.draw(thumb);
  }

  private draw(thumb: HTMLElement): void {
    this.lastShownId = thumb.id;
    const imageRequest = GalleryImageCache.getImageRequest(thumb);

    if (imageRequest === undefined) {
      GalleryImageCache.createImageFromThumb(thumb);
      GalleryImageCache.createLowResolutionImage(thumb);
      return;
    }

    if (imageRequest.isIncomplete) {
      GalleryImageCache.createLowResolutionImage(thumb);
      return;
    }
    GalleryCanvas.draw(imageRequest.bitmap);
  }
}

export const GalleryImageRenderer = new ImageRenderer();
