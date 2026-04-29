import * as GalleryImageCanvas from "./gallery_image_canvas";
import * as GalleryImageLoader from "./gallery_image_loader";
import * as GalleryUpscaler from "../upscalers/gallery_upscaler";
import { GalleryAbstractController } from "../../gallery_abstract_controller";
import { ImageRequest } from "../../../../types/gallery_image_request";
import { USING_FIREFOX } from "../../../../../../lib/environment/environment";

class ImageController extends GalleryAbstractController {
  private activeId: string;

  constructor() {
    super();
    this.activeId = "";
    GalleryImageLoader.setCompletionCallback(this.onBitmapLoaded.bind(this));
    GalleryImageCanvas.mount(this.container);
  }

  public preload(thumbs: HTMLElement[]): void {
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

  public exitGallery(): void {
    if (USING_FIREFOX) {
      GalleryImageCanvas.clear();
    }
  }
  public correctOrientation(): void {
    GalleryImageCanvas.correctOrientation();
    this.redisplayActiveThumb();
  }

  public toggleZoomCursor(value: boolean): void {
    this.container.classList.toggle("zooming", value);
  }

  public toggleZoom(value: boolean | undefined): boolean {
    return this.container.classList.toggle("zoomed-in", value);
  }

  public zoomToPoint = (x: number, y: number): void => GalleryImageCanvas.zoomToPoint(x, y);
  public upscaleCachedThumbs = (): Promise<void> => GalleryUpscaler.upscaleBatch(GalleryImageLoader.completedRequests());
  public handleFavoritesAddedToCurrentPage = (thumbs: HTMLElement[]): void => GalleryUpscaler.presetCanvasDimensions(thumbs);
  public downscaleAll = (): void => GalleryUpscaler.handlePageChange();

  protected display(thumb: HTMLElement): void {
    this.activeId = thumb.id;
    const cached = GalleryImageLoader.get(thumb.id);

    if (cached) {
      GalleryImageCanvas.draw(cached.request.bitmap);
      return;
    }
    GalleryImageLoader.loadImmediate(thumb);
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

export const GalleryImageController = new ImageController();
