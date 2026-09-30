import { GalleryAbstractImageBudgeter, GalleryLimitImageBudgeter, GalleryMemoryImageBudgeter } from "@/features/gallery/view/rendering/image/budgeter";
import { GalleryBudget, Renderer } from "@/features/gallery/types/types";
import { AppContext } from "@/app/context/context";
import { Environment } from "@/core/boundary/environment";
import { Favorite } from "@/types/favorite";
import { GalleryAbstractUpscaler } from "@/features/gallery/view/rendering/image/abstract_upscaler";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryImageCanvas } from "@/features/gallery/view/rendering/image/canvas";
import { GalleryImageFetcher } from "@/features/gallery/view/rendering/image/fetcher";
import { GalleryImageLoader } from "@/features/gallery/view/rendering/image/loader";
import { GalleryMainThreadUpscaler } from "@/features/gallery/view/rendering/image/main_thread_upscaler";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";
import { GalleryWorkerUpscalerWrapper } from "@/features/gallery/view/rendering/image/worker_upscaler_wrapper";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { Point } from "@/types/geometry";
import { PostMedia } from "@/core/domain/post/post";
import { Preferences } from "@/app/context/preferences";
import { Shell } from "@/app/context/shell";
import { div } from "@/utils/browser/element";
import { isImage } from "@/lib/media/media_type";
import { partition } from "@/utils/pure/array";
import { withTimeout } from "@/lib/async/scheduling";

export class GalleryImageRenderer implements Renderer {
  public readonly root: HTMLElement;
  private readonly shell: Shell;
  private readonly favoriteFor: (id: string) => Favorite | undefined;
  private readonly fetcher: GalleryImageFetcher;
  private readonly loader: GalleryImageLoader;
  private readonly upscaler: GalleryAbstractUpscaler;
  private readonly canvas: GalleryImageCanvas;
  private activeItem: PostMedia | undefined;

  constructor(context: AppContext, favoriteFor: (id: string) => Favorite | undefined, budget: GalleryBudget) {
    const { environment, preferences, shell } = context;

    this.root = div();
    this.shell = shell;
    this.favoriteFor = favoriteFor;
    this.fetcher = new GalleryImageFetcher(context.ports.remoteMedia);
    this.loader = this.createLoader(environment);
    this.upscaler = this.createUpscaler(environment, budget, preferences, shell);
    this.canvas = new GalleryImageCanvas(environment, budget);
    this.canvas.mount(this.root);
    this.activeItem = undefined;
  }

  public render(item: PostMedia): void {
    this.root.style.visibility = "visible";
    this.paint(item);
  }

  public hide(): void {
    this.root.style.visibility = "hidden";
    this.toggleZoomCursor(false);
    this.toggleZoom(false);
    this.canvas.release();
  }

  public async cache(items: PostMedia[]): Promise<void> {
    await this.waitForAllThumbsToLoadWithTimeout();
    const [images, animated] = partition(items, (item) => isImage(item));
    const rejected = this.loader.load(images);

    this.upscaler.fetchThenPaintAll(this.disposableRequests([...animated, ...rejected]));
  }

  public async upscale(items: PostMedia[]): Promise<void> {
    await this.waitForAllThumbsToLoadWithTimeout();
    this.upscaler.fetchThenPaintAll(this.disposableRequests(items));
  }

  public toggleZoomCursor(value: boolean): boolean {
    return this.root.classList.toggle("gallery-image-frame--zooming", value);
  }

  public toggleZoom(value?: boolean): boolean {
    return this.root.classList.toggle("gallery-image-frame--zoomed", value);
  }

  public zoomToPoint(point: Point): void {
    return this.canvas.zoomToPoint(point);
  }

  public reUpscale(): void {
    this.upscaler.repaint(this.loader.completedRequests());
  }

  public downscaleAll(): void {
    this.upscaler.eraseAll();
  }

  public pauseUpscaler(): void {
    this.upscaler.pause();
  }

  public resumeUpscaler(): void {
    this.upscaler.resume();
  }

  public correctOrientation(): void {
    this.canvas.correctOrientation();

    if (this.activeItem === undefined) {
      return;
    }
    const cached = this.loader.get(this.activeItem.id);

    if (cached && cached.status === "complete") {
      this.paint(this.activeItem);
    }
  }

  private createLoader(environment: Environment): GalleryImageLoader {
    const budgeter = this.createBudgeter(environment);
    return new GalleryImageLoader(this.fetcher, budgeter, (request) => this.onBitmapLoaded(request));
  }

  private createBudgeter(environment: Environment): GalleryAbstractImageBudgeter {
    if (environment.mode === "favorites" && environment.device !== "mobile") {
      return new GalleryMemoryImageBudgeter(this.favoriteFor, GalleryConfig.imageMegabyteLimit, GalleryConfig.minimumCachedImageCount);
    }
    const limit = environment.device === "mobile" ? GalleryConfig.cachedImageCount.mobile : GalleryConfig.cachedImageCount.desktop;
    return new GalleryLimitImageBudgeter(limit);
  }

  private createUpscaler(environment: Environment, budget: GalleryBudget, preferences: Preferences, shell: Shell): GalleryAbstractUpscaler {
    const settings = environment.mode === "postList" ? preferences.postList : preferences.favorites;
    const canvasFor = (id: string): HTMLCanvasElement | null => shell.findThumb(id)?.querySelector("canvas") ?? null;
    const fetchBitmap = (request: ImageRequest): Promise<boolean> => this.fetcher.fetchBitmap(request);
    const { paintDelay, canvasWidth } = budget.upscale;
    const args = [canvasFor, settings.upscaleThumbs, settings.upscaleQuality, fetchBitmap, paintDelay, canvasWidth, GalleryUpscaleConfig.maxUpscaledCanvasHeight] as const;
    return GalleryConfig.useOffscreenThumbUpscaler ? new GalleryWorkerUpscalerWrapper(...args) : new GalleryMainThreadUpscaler(...args);
  }

  private paint(item: PostMedia): void {
    this.activeItem = item;
    const cached = this.loader.get(item.id);

    if (cached === undefined || cached.request.isIncomplete) {
      this.loader.loadImmediate(item);
      return;
    }
    this.canvas.draw(cached.request.bitmap);
  }

  private onBitmapLoaded(request: ImageRequest): void {
    this.upscaler.tryPainting(request);

    if (request.id === this.activeItem?.id) {
      this.paint(request.item);
    }
  }

  private disposableRequests(items: PostMedia[]): ImageRequest[] {
    return items.map(item => new ImageRequest(item, true));
  }

  private waitForAllThumbsToLoadWithTimeout(): Promise<unknown[]> {
    return withTimeout(this.shell.waitForContentThumbsToLoad(), GalleryConfig.preloadWaitingTimeout);
  }
}
