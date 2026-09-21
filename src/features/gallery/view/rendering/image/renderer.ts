import { Environment } from "@/app/context/environment";
import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/upscalers/abstract_upscaler";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryImageCanvas } from "@/features/gallery/view/rendering/image/canvas";
import { GalleryImageLoader } from "@/features/gallery/view/rendering/image/loader";
import { GalleryMainThreadUpscaler } from "@/features/gallery/view/rendering/image/upscalers/main_thread_upscaler";
import { GalleryWorkerUpscalerWrapper } from "@/features/gallery/view/rendering/image/upscalers/worker_upscaler_wrapper";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { Point } from "@/types/geometry";
import { Preferences } from "@/app/context/preferences";
import { Renderer } from "@/features/gallery/types/types";
import { Shell } from "@/app/context/shell";
import { div } from "@/utils/browser/element";
import { isImageThumb } from "@/lib/ui/thumb/media_item";
import { withTimeout } from "@/lib/async/scheduling";

export class GalleryImageRenderer implements Renderer {
  public readonly root = div();
  private readonly environment: Environment;
  private readonly shell: Shell;
  private readonly loader: GalleryImageLoader;
  private readonly upscaler: GalleryAbstractUpscaler;
  private readonly canvas: GalleryImageCanvas;
  private activeId = "";

  constructor(environment: Environment, preferences: Preferences, shell: Shell) {
    this.environment = environment;
    this.shell = shell;
    this.loader = new GalleryImageLoader(environment, (request) => this.onBitmapLoaded(request));
    this.upscaler = GalleryConfig.useOffscreenThumbUpscaler ? new GalleryWorkerUpscalerWrapper(environment, preferences, shell) : new GalleryMainThreadUpscaler(environment, preferences, shell);
    this.canvas = new GalleryImageCanvas(environment);
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

    if (this.environment.usingFirefox) {
      this.canvas.clear();
    }
  }

  public async cache(thumbs: HTMLElement[]): Promise<void> {
    await this.waitForAllThumbsToLoadWithTimeout();
    const rejected = this.loader
      .load(thumbs)
      .map((request) => request.thumb);
    const animated = thumbs.filter((thumb) => !isImageThumb(thumb));

    this.upscaler.fetchThenPaintAll(this.disposableRequests([...animated, ...rejected]));
  }

  public async upscale(thumbs: HTMLElement[]): Promise<void> {
    await this.waitForAllThumbsToLoadWithTimeout();
    this.upscaler.fetchThenPaintAll(this.disposableRequests(thumbs));
  }

  public reupscaleCachedThumbs(): void {
    this.upscaler.eraseAll();
    setTimeout(() => this.upscaleCached(), 10);
  }

  public toggleZoomCursor(value: boolean): boolean {
    return this.root.classList.toggle("gallery-image-frame--zooming", value);
  }

  public toggleZoom(value: boolean | undefined): boolean {
    return this.root.classList.toggle("gallery-image-frame--zoomed", value);
  }

  public zoomToPoint(point: Point): void {
    return this.canvas.zoomToPoint(point);
  }

  public upscaleCached(): void {
    this.upscaler.repaintAll(this.loader.completedRequests());
  }

  public downscaleAll(): void {
    this.upscaler.eraseAll();
  }

  public downscaleDetached(): void {
    this.upscaler.eraseDetached();
  }

  public pauseUpscaler(): void {
    this.upscaler.pause();
  }

  public resumeUpscaler(): void {
    this.upscaler.resume();
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
    this.upscaler.tryPainting(request);

    if (request.id === this.activeId) {
      this.draw(request.thumb);
    }
  }

  private disposableRequests(thumbs: HTMLElement[]): ImageRequest[] {
    return thumbs.map((thumb) => new ImageRequest(thumb, true));
  }

  private waitForAllThumbsToLoadWithTimeout(): Promise<unknown[]> {
    return withTimeout(this.shell.waitForContentThumbsToLoad(), GalleryConfig.preloadWaitingTimeout);
  }
}
