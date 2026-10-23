import { Media } from "@/core/domain/media/media";
import { UpscalePacer } from "@/core/ui/post_grid/upscale_pacer";

export const MAX_CANVAS_WIDTH = 500;
export const MAX_CANVAS_HEIGHT = 16_000;
export const DECODE_RATE_LIMIT = { concurrency: 3, ratePerSecond: 20 };

interface UpscalerDependencies {
  canvas: HTMLCanvasElement;
  media: Media;
  decodeStill: (media: Media, signal: AbortSignal, width: number) => Promise<ImageBitmap>;
  upscalePacer: Pick<UpscalePacer, "decodeWhenQuiet" | "queuePaint">;
}

export class Upscaler {
  private requestVersion: number;
  private abortController: AbortController | undefined;
  private cancelHeldDecode: (() => void) | undefined;
  private isDrawn: boolean;

  constructor(private readonly dependencies: UpscalerDependencies) {
    this.requestVersion = 0;
    this.abortController = undefined;
    this.cancelHeldDecode = undefined;
    this.isDrawn = false;
  }

  public hide(): void {
    if (this.isDrawn) {
      this.dependencies.canvas.hidden = true;
    }
    this.cancel();
  }

  public upscale(): void {
    if (this.isDrawn) {
      this.dependencies.canvas.hidden = false;
      return;
    }

    if (this.abortController !== undefined || this.cancelHeldDecode !== undefined) {
      return;
    }
    this.cancelHeldDecode = this.dependencies.upscalePacer.decodeWhenQuiet(() => {
      this.cancelHeldDecode = undefined;
      this.decode();
    });
  }

  public cancel(): void {
    this.cancelHeldDecode?.();
    this.cancelHeldDecode = undefined;

    if (this.abortController === undefined) {
      return;
    }
    this.requestVersion += 1;
    this.abortController.abort();
    this.abortController = undefined;
  }

  private decode(): void {
    this.requestVersion += 1;
    const version = this.requestVersion;
    const controller = new AbortController();
    const isCurrent = (): boolean => !controller.signal.aborted && version === this.requestVersion;

    this.abortController = controller;
    this.dependencies.decodeStill(this.dependencies.media, controller.signal, MAX_CANVAS_WIDTH)
      .then(bitmap => {
        if (!isCurrent()) {
          bitmap.close();
          return;
        }
        this.dependencies.upscalePacer.queuePaint(() => {
          if (!isCurrent()) {
            bitmap.close();
            return;
          }
          drawBitmap(this.dependencies.canvas, bitmap);
          this.isDrawn = true;
          this.abortController = undefined;
        });
      })
      .catch(error => {
        if (isCurrent()) {
          this.abortController = undefined;
          console.error(error);
        }
      });
  }
}

function drawBitmap(canvas: HTMLCanvasElement, bitmap: ImageBitmap): void {
  try {
    const scale = Math.min(1, MAX_CANVAS_WIDTH / bitmap.width, MAX_CANVAS_HEIGHT / bitmap.height);

    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    canvas.hidden = false;
  } finally {
    bitmap.close();
  }
}
