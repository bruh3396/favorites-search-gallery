import { Media } from "@/core/domain/media/media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

const MAX_CANVAS_WIDTH = 700;
const MAX_CANVAS_HEIGHT = 16_000;

export const UPSCALE_DELAY = 300;

interface UpscalerDependencies {
  canvas: HTMLCanvasElement;
  media: Media;
  decodeImage: (media: Media, signal: AbortSignal) => Promise<ImageBitmap>;
  scheduler: Pick<Scheduler, "schedule">;
}

export class Upscaler {
  private requestVersion: number;
  private abortController: AbortController | undefined;
  private completed: boolean;
  private cancelPendingStart: (() => void) | undefined;

  constructor(private readonly dependencies: UpscalerDependencies) {
    this.requestVersion = 0;
    this.abortController = undefined;
    this.completed = false;
    this.cancelPendingStart = undefined;
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

    if (this.abortController !== undefined || this.cancelPendingStart !== undefined) {
      return;
    }
    this.cancelPendingStart = this.dependencies.scheduler.schedule(() => {
      this.cancelPendingStart = undefined;
      this.start();
    }, UPSCALE_DELAY);
  }

  public dispose(): void {
    this.cancelPendingStart?.();
    this.cancelPendingStart = undefined;

    if (this.abortController === undefined) {
      return;
    }
    this.requestVersion += 1;
    this.abortController.abort();
    this.abortController = undefined;
  }

  private start(): void {
    this.requestVersion += 1;
    const version = this.requestVersion;
    const controller = new AbortController();

    this.abortController = controller;
    this.dependencies.decodeImage(this.dependencies.media, controller.signal)
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
