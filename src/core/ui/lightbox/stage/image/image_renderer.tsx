import { DebouncedTask, createDebouncedTask } from "@/core/utils/async/debouncer";
import { Signal, effect } from "@/core/utils/reactive/signal";
import { BitmapCache } from "@/core/ui/lightbox/stage/image/bitmap_cache";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { LightboxRendererClass } from "@/core/ui/lightbox/stage/renderer";
import { LightboxStageRenderer } from "@/core/ui/lightbox/stage/renderer";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/media/media";
import { PreloadingRenderer } from "@/core/ui/lightbox/stage/preloading_renderer";
import { Resource } from "@/core/utils/reactive/resource";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { doNothing } from "@/core/utils/function/function";
import { h } from "@/core/ui/h/h";

const SETTLE_DELAY = 200;

export interface ImageRendererDependencies {
  resolvePreviewUrl: (media: Media) => Promise<string>;
  resolveOriginalImageFallbackUrl: (media: Media) => Promise<string>;
  fetchOriginal: (media: Media, signal: AbortSignal) => Promise<Blob>;
  bitmapDecoder: BitmapDecoder;
  scheduler: Pick<Scheduler, "schedule">;
}

export class ImageRenderer extends PreloadingRenderer implements LightboxStageRenderer {
  public readonly root: HTMLElement;
  private readonly preview: HTMLImageElement;
  private readonly original: HTMLCanvasElement;
  private readonly bitmapCache: BitmapCache;
  private readonly originalLoadTask: DebouncedTask<[item: MediaItem, resolve: (bitmap: ImageBitmap | undefined) => void, reject: (reason: unknown) => void]>;
  private readonly current = new Signal<MediaItem | undefined>(undefined);
  private readonly previewUrlResource: Resource<MediaItem, string>;
  private readonly originalBitmapResource: Resource<MediaItem, ImageBitmap | undefined>;
  private readonly stopRenderEffect: () => void;

  constructor(dependencies: ImageRendererDependencies) {
    super(dependencies.scheduler);
    this.preview = <img className={LightboxRendererClass.media} alt="" decoding="async" /> as HTMLImageElement;
    this.original = <canvas className={LightboxRendererClass.media} /> as HTMLCanvasElement;
    this.root = <div className={LightboxRendererClass.root}>{this.preview}{this.original}</div>;
    this.bitmapCache = new BitmapCache({
      fetchOriginal: dependencies.fetchOriginal,
      resolveOriginalImageFallbackUrl: dependencies.resolveOriginalImageFallbackUrl,
      bitmapDecoder: dependencies.bitmapDecoder
    });
    this.originalLoadTask = createDebouncedTask({ delay: SETTLE_DELAY, leading: true }, dependencies.scheduler, (item, resolve, reject) => {
      this.bitmapCache.load(item).then(resolve, reject);
    });
    this.previewUrlResource = new Resource({
      source: this.current,
      load: (item): Promise<string> => dependencies.resolvePreviewUrl(item.media)
    });
    this.originalBitmapResource = new Resource({
      source: this.current,
      load: (item): Promise<ImageBitmap | undefined> => this.loadOnceSettled(item)
    });
    this.stopRenderEffect = effect(() => this.render());
  }

  public show(item: MediaItem): void {
    this.current.value = item;
  }

  public clear(): void {
    this.current.value = undefined;
    this.originalLoadTask.cancel();
    this.retainNeighbors();
  }

  public override setNeighbors(items: readonly MediaItem[]): void {
    super.setNeighbors(items);
    this.retainNeighbors();
  }

  public dispose(): void {
    this.disposePreloading();
    this.clear();
    this.stopRenderEffect();
    this.previewUrlResource.dispose();
    this.originalBitmapResource.dispose();
    this.bitmapCache.keepOnly([]);
  }

  protected override preloadNeighbors(items: readonly MediaItem[]): void {
    items.forEach(item => this.bitmapCache.load(item).catch(doNothing));
  }

  private retainNeighbors(): void {
    const current = this.current.peek();
    const neighbors = this.getNeighbors();

    this.bitmapCache.keepOnly(current === undefined ? neighbors : [current, ...neighbors]);
  }

  private render(): void {
    const item = this.current.value;
    const previewUrl = this.previewUrlResource.value.value;
    const bitmap = this.originalBitmapResource.value.value;

    if (item === undefined) {
      this.root.hidden = true;
      this.preview.hidden = true;
      this.preview.removeAttribute("src");
      this.original.hidden = true;
      clearCanvas(this.original);
      return;
    }
    this.root.hidden = false;
    this.renderPreview(previewUrl, bitmap);
    this.renderOriginal(bitmap);
  }

  private renderPreview(url: string | undefined, bitmap: ImageBitmap | undefined): void {
    if (url === undefined) {
      this.preview.removeAttribute("src");
    } else if (this.preview.getAttribute("src") !== url) {
      this.preview.src = url;
    }
    this.preview.hidden = bitmap !== undefined;
  }

  private renderOriginal(bitmap: ImageBitmap | undefined): void {
    this.original.hidden = bitmap === undefined;

    if (bitmap === undefined) {
      clearCanvas(this.original);
    } else {
      drawBitmap(this.original, bitmap);
    }
    this.preview.hidden = bitmap !== undefined;
  }

  private loadOnceSettled(item: MediaItem): Promise<ImageBitmap | undefined> {
    if (this.bitmapCache.has(item.id)) {
      this.originalLoadTask.cancel();
      return this.bitmapCache.load(item);
    }
    return new Promise((resolve, reject) => this.originalLoadTask(item, resolve, reject));
  }
}

function drawBitmap(canvas: HTMLCanvasElement, bitmap: ImageBitmap): void {
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
}

function clearCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0;
  canvas.height = 0;
}
