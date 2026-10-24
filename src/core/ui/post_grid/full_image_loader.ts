import { Readable, effect } from "@/core/utils/reactive/signal";
import { BatchDebouncer } from "@/core/utils/async/batch_debouncer";
import { Media } from "@/core/domain/media/media";
import { RateLimiter } from "@/core/utils/async/rate_limiter";

export const MAX_CANVAS_WIDTH = 500;
export const MAX_CANVAS_HEIGHT = 16_000;

interface FullImageLoaderDependencies {
  canvas: HTMLCanvasElement;
  media: Media;
  decodeStill: (media: Media, signal: AbortSignal, width: number) => Promise<ImageBitmap>;
  decodeDebouncer: Pick<BatchDebouncer, "add">;
  paintLimiter: Pick<RateLimiter, "run">;
  enabled: Readable<boolean>;
  paused: Readable<boolean>;
}

export class FullImageLoader {
  private requestVersion: number;
  private abortController: AbortController | undefined;
  private cancelHeldDecode: (() => void) | undefined;
  private isDrawn: boolean;

  constructor(private readonly dependencies: FullImageLoaderDependencies) {
    this.requestVersion = 0;
    this.abortController = undefined;
    this.cancelHeldDecode = undefined;
    this.isDrawn = false;
  }

  public trackVisibility(visible: Readable<boolean>): () => void {
    const stop = effect(() => this.update(visible.value));
    return (): void => {
      stop();
      this.cancel();
    };
  }

  public hide(): void {
    if (this.isDrawn) {
      this.dependencies.canvas.hidden = true;
    }
    this.cancel();
  }

  public show(): void {
    if (this.isDrawn) {
      this.dependencies.canvas.hidden = false;
      return;
    }

    if (this.abortController !== undefined || this.cancelHeldDecode !== undefined) {
      return;
    }
    this.cancelHeldDecode = this.dependencies.decodeDebouncer.add(() => {
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

  private update(isVisible: boolean): void {
    if (this.dependencies.paused.value) {
      this.cancel();
    } else if (!this.dependencies.enabled.value) {
      this.hide();
    } else if (isVisible) {
      this.show();
    } else {
      this.cancel();
    }
  }

  private decode(): void {
    this.requestVersion += 1;
    const version = this.requestVersion;
    const controller = new AbortController();
    const isCurrent = (): boolean => !controller.signal.aborted && version === this.requestVersion;

    this.abortController = controller;
    this.dependencies.decodeStill(this.dependencies.media, controller.signal, MAX_CANVAS_WIDTH)
      .then(bitmap => this.dependencies.paintLimiter.run(() => {
        if (!isCurrent()) {
          bitmap.close();
          return Promise.resolve();
        }
        drawBitmap(this.dependencies.canvas, bitmap);
        this.isDrawn = true;
        this.abortController = undefined;
        return Promise.resolve();
      }, controller.signal).catch(() => bitmap.close()))
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
