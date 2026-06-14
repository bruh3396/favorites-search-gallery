import { GalleryConfig } from "@/config/gallery_config";
import { ThrottleQueue } from "@/lib/async/throttle_queue";

const bitmapCloseQueue = new ThrottleQueue(GalleryConfig.bitmapCloseDelay);

export class ImageRequest {
  public readonly id: string;
  public readonly thumb: HTMLElement;
  public readonly abortController: AbortController;
  public readonly disposable: boolean;
  public bitmap: ImageBitmap | null;
  public cancelled: boolean;

  constructor(thumb: HTMLElement, disposable: boolean = false) {
    this.id = thumb.id;
    this.thumb = thumb;
    this.bitmap = null;
    this.abortController = new AbortController();
    this.cancelled = false;
    this.disposable = disposable;
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
    this.cancelled = true;
    this.abortController.abort();
  }

  public async close(): Promise<void> {
    await bitmapCloseQueue.wait();

    if (this.bitmap instanceof ImageBitmap) {
      this.bitmap.close();
    }
  }
}
