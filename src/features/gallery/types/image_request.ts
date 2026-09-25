import { GalleryConfig } from "@/config/gallery_config";
import { MediaItem } from "@/types/media";
import { ThrottleQueue } from "@/lib/async/rate_limiting";

const bitmapCloseQueue = new ThrottleQueue(GalleryConfig.bitmapCloseDelay);

export class ImageRequest {
  public readonly item: MediaItem;
  public readonly abortController: AbortController;
  public readonly isDisposable: boolean;
  public isCancelled: boolean;
  public bitmap: ImageBitmap | null;

  constructor(item: MediaItem, disposable: boolean = false) {
    this.item = item;
    this.bitmap = null;
    this.abortController = new AbortController();
    this.isCancelled = false;
    this.isDisposable = disposable;
  }

  public get id(): string {
    return this.item.id;
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

export class LowResolutionImageRequest extends ImageRequest {
  constructor(request: ImageRequest) {
    super(request.item);
  }

  public get isHighRes(): boolean {
    return false;
  }
}
