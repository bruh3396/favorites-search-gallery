import { GalleryConfig } from "@/config/gallery_config";
import { ThrottleQueue } from "@/lib/async/rate_limiting";

const bitmapCloseQueue = new ThrottleQueue(GalleryConfig.bitmapCloseDelay);

export class ImageRequest {
  public readonly id: string;
  public readonly thumb: HTMLElement;
  public readonly abortController: AbortController;
  public readonly isDisposable: boolean;
  public isCancelled: boolean;
  public bitmap: ImageBitmap | null;

  constructor(thumb: HTMLElement, disposable: boolean = false) {
    this.id = thumb.id;
    this.thumb = thumb;
    this.bitmap = null;
    this.abortController = new AbortController();
    this.isCancelled = false;
    this.isDisposable = disposable;
  }

  public get isIncomplete(): boolean {
    return this.bitmap === null;
  }

  public get hasCompleted(): boolean {
    return !this.isIncomplete;
  }

  public get isHighRes(): boolean {
    return true;
  }

  public complete(bitmap: ImageBitmap): void {
    this.bitmap = bitmap;
  }

  public cancel(): void {
    this.isCancelled = true;
    this.abortController.abort();
  }

  public async dispose(): Promise<void> {
    await bitmapCloseQueue.wait();

    if (this.bitmap instanceof ImageBitmap) {
      this.bitmap.close();
    }
  }
}
