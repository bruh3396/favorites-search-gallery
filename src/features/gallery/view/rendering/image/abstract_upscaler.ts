import { ImageRequest } from "@/features/gallery/types/image_request";
import { Preference } from "@/lib/storage/preference";
import { ThrottleQueue } from "@/lib/async/rate_limiting";

export interface GalleryUpscalerConfiguration {
  paintDelay: number;
  baseCanvasWidth: number;
  maxUpscaledCanvasHeight: number;
}

export interface GalleryUpscalerDependencies {
  canvasFor: (id: string) => HTMLCanvasElement | null;
  enabled: Preference<boolean>;
  quality: Preference<number>;
  fetchBitmap: (request: ImageRequest) => Promise<boolean>;
}

export abstract class GalleryAbstractUpscaler {
  protected readonly canvasFor: (id: string) => HTMLCanvasElement | null;
  protected readonly maxUpscaledCanvasHeight: number;
  private readonly enabled: Preference<boolean>;
  private readonly quality: Preference<number>;
  private readonly fetchBitmap: (request: ImageRequest) => Promise<boolean>;
  private readonly baseCanvasWidth: number;
  private readonly paintedWidths: Map<HTMLCanvasElement, number> = new Map();
  private readonly paintQueue: ThrottleQueue;
  private paused: boolean = false;

  constructor(configuration: GalleryUpscalerConfiguration, dependencies: GalleryUpscalerDependencies) {
    this.canvasFor = dependencies.canvasFor;
    this.enabled = dependencies.enabled;
    this.quality = dependencies.quality;
    this.fetchBitmap = dependencies.fetchBitmap;
    this.baseCanvasWidth = configuration.baseCanvasWidth;
    this.maxUpscaledCanvasHeight = configuration.maxUpscaledCanvasHeight;
    this.paintQueue = new ThrottleQueue(configuration.paintDelay);
  }

  protected get upscaledCanvasWidth(): number {
    return Math.round(this.baseCanvasWidth * this.quality.value);
  }

  public pause(): void {
    this.paused = true;
  }

  public resume(): void {
    this.paused = false;
  }

  public tryPainting(request: ImageRequest): void {
    if (this.isEnabled() && this.isEligible(request) && request.hasCompleted) {
      this.trackCanvas(request.id);
      this.paint(request);
    }
  }

  public fetchThenPaintAll(requests: ImageRequest[]): void {
    if (this.isEnabled()) {
      requests.forEach(request => this.fetchThenPaint(request));
    }
  }

  public async repaint(completedRequests: ImageRequest[]): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    for (const request of completedRequests) {
      if (!(await this.paintQueue.wait())) {
        return;
      }

      if (this.isEligible(request)) {
        this.trackCanvas(request.id);
        this.paint(request);
      }
    }
  }

  public eraseAll(): void {
    this.paintQueue.reset();

    for (const canvas of this.paintedWidths.keys()) {
      this.erase(canvas);
    }
    this.paintedWidths.clear();
  }

  private async fetchThenPaint(request: ImageRequest): Promise<void> {
    if (!this.isEligible(request) || !await this.paintQueue.wait() || !this.isEligible(request)) {
      return;
    }

    if (!await this.fetchBitmap(request)) {
      return;
    }
    this.tryPainting(request);
  }

  private isEnabled(): boolean {
    return this.enabled.value && !this.paused;
  }

  private isEligible(request: ImageRequest): boolean {
    const canvas = this.canvasFor(request.id);
    return canvas !== null && this.paintedWidths.get(canvas) !== this.upscaledCanvasWidth && request.isHighRes;
  }

  private trackCanvas(id: string): void {
    const canvas = this.canvasFor(id);

    if (canvas !== null) {
      this.paintedWidths.set(canvas, this.upscaledCanvasWidth);
    }
  }

  protected abstract erase(canvas: HTMLCanvasElement): void;
  protected abstract paint(request: ImageRequest): void;
}
