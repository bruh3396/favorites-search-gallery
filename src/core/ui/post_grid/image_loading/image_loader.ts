import { Readable, effect } from "@/core/utils/reactive/signal";
import { BatchDebouncer } from "@/core/utils/async/batch_debouncer";
import { Media } from "@/core/domain/media/media";

export interface ImageLoaderConfiguration {
  readonly maxCanvasHeight: number;
}

export interface ImageLoaderDependencies {
  canvas: HTMLCanvasElement;
  media: Media;
  targetWidth: Readable<number>;
  decodeForDraw: (media: Media, signal: AbortSignal, width: number) => Promise<ImageBitmap>;
  batchDebouncer: Pick<BatchDebouncer, "add">;
  enabled: Readable<boolean>;
  paused: Readable<boolean>;
}

export class ImageLoader {
  private requestVersion: number;
  private abortController: AbortController | undefined;
  private cancelHeldDecode: (() => void) | undefined;
  private requestedWidth: number;
  private drawnWidth: number;

  constructor(private readonly configuration: ImageLoaderConfiguration, private readonly dependencies: ImageLoaderDependencies) {
    this.requestVersion = 0;
    this.abortController = undefined;
    this.cancelHeldDecode = undefined;
    this.requestedWidth = 0;
    this.drawnWidth = 0;
  }

  public trackVisibility(visible: Readable<boolean>): () => void {
    const stop = effect(() => this.update(visible.value));
    return (): void => {
      stop();
      this.cancel();
    };
  }

  public hide(): void {
    if (this.drawnWidth > 0) {
      this.dependencies.canvas.hidden = true;
    }
    this.cancel();
  }

  public show(): void {
    const width = this.dependencies.targetWidth.value;

    if (this.drawnWidth > 0) {
      this.dependencies.canvas.hidden = false;
    }

    if (width <= this.drawnWidth || this.cancelHeldDecode !== undefined) {
      return;
    }

    if (this.abortController !== undefined) {
      if (width <= this.requestedWidth) {
        return;
      }
      this.cancel();
    }
    this.cancelHeldDecode = this.dependencies.batchDebouncer.add(() => {
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
    const width = this.dependencies.targetWidth.value;

    if (width <= this.drawnWidth) {
      return;
    }
    this.requestVersion += 1;
    const version = this.requestVersion;
    const controller = new AbortController();
    const isCurrent = (): boolean => !controller.signal.aborted && version === this.requestVersion;

    this.abortController = controller;
    this.requestedWidth = width;
    this.dependencies.decodeForDraw(this.dependencies.media, controller.signal, width)
      .then(bitmap => {
        if (!isCurrent()) {
          bitmap.close();
          return;
        }
        drawBitmap(this.dependencies.canvas, bitmap, { width, maxHeight: this.configuration.maxCanvasHeight });
        this.drawnWidth = width;
        this.abortController = undefined;
      })
      .catch(error => {
        if (isCurrent()) {
          this.abortController = undefined;
          console.error(error);
        }
      });
  }
}

function drawBitmap(canvas: HTMLCanvasElement, bitmap: ImageBitmap, { width, maxHeight }: { width: number; maxHeight: number }): void {
  try {
    const scale = Math.min(1, width / bitmap.width, maxHeight / bitmap.height);

    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    canvas.hidden = false;
  } finally {
    bitmap.close();
  }
}
