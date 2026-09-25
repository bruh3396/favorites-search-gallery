import { ImageRequest } from "@/features/gallery/types/image_request";
import { Preference } from "@/lib/storage/preference";
import { ThrottleQueue } from "@/lib/async/rate_limiting";

export abstract class GalleryAbstractUpscaler {
  protected readonly needsBitmapForPaint: boolean = true;
  private readonly paintedWidths: Map<HTMLCanvasElement, number> = new Map();
  private readonly paintQueue: ThrottleQueue;
  private paused: boolean = false;

  constructor(
    protected readonly canvasFor: (id: string) => HTMLCanvasElement | null,
    private readonly enabled: Preference<boolean>,
    private readonly quality: Preference<number>,
    private readonly fetchBitmap: (request: ImageRequest) => Promise<boolean>,
    paintDelay: number,
    private readonly baseCanvasWidth: number,
    protected readonly maxUpscaledCanvasHeight: number
  ) {
    this.paintQueue = new ThrottleQueue(paintDelay);
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
    if (this.isEnabled() && this.isEligible(request) && this.isReadyToPaint(request)) {
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

    if (this.needsBitmapForPaint && !await this.fetchBitmap(request)) {
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

  private isReadyToPaint(request: ImageRequest): boolean {
    return request.hasCompleted || !this.needsBitmapForPaint;
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
