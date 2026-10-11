import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { Media } from "@/core/domain/media/media";

interface UpscalerDependencies {
  readonly canvas: HTMLCanvasElement;
  readonly media: Media;
  readonly bitmapDecoder: BitmapDecoder;
  readonly fetchImage: (media: Media, signal: AbortSignal) => Promise<Blob>;
}

export class Upscaler {
  private requestVersion: number;
  private abortController: AbortController | undefined;
  private completed: boolean;

  constructor(private readonly dependencies: UpscalerDependencies) {
    this.requestVersion = 0;
    this.abortController = undefined;
    this.completed = false;
  }

  private get inFlight(): boolean {
    return this.abortController !== undefined;
  }

  public disable(): void {
    if (this.completed) {
      this.dependencies.canvas.hidden = true;
    }
    this.dispose();
  }

  public upscale(): void {
    if (this.completed) {
      this.dependencies.canvas.hidden = false;
      return;
    }

    if (this.inFlight) {
      return;
    }
    this.requestVersion += 1;
    const version = this.requestVersion;
    const controller = new AbortController();

    this.abortController = controller;
    this.dependencies.fetchImage(this.dependencies.media, controller.signal)
      .then(blob => this.dependencies.bitmapDecoder.decode(blob))
      .then(bitmap => {
        if (controller.signal.aborted || version !== this.requestVersion) {
          bitmap.close();
          return;
        }
        drawBitmap(this.dependencies.canvas, bitmap);
        this.completed = true;
        this.abortController = undefined;
      })
      .catch(error => {
        if (!controller.signal.aborted && version === this.requestVersion) {
          this.abortController = undefined;
          console.error(error);
        }
      });
  }

  public dispose(): void {
    if (this.abortController === undefined) {
      return;
    }
    this.requestVersion += 1;
    this.abortController.abort();
    this.abortController = undefined;
  }
}

function drawBitmap(canvas: HTMLCanvasElement, bitmap: ImageBitmap): void {
  try {
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
    canvas.hidden = false;
  } finally {
    bitmap.close();
  }
}
