import { ContentType } from "../../../types/primitives/primitives";
import { ImageRequestI } from "./gallery_types";
import { ThrottledQueue } from "../../../components/functional/throttled_queue";
import { getContentTypeFromThumb } from "../../../utils/dom/tags";

const IMAGE_BITMAP_CLOSE_QUEUE = new ThrottledQueue(200);

export class ImageRequest implements ImageRequestI {
  public id: string;
  public thumb: HTMLElement;
  public bitmap: ImageBitmap | null;
  public abortController: AbortController;
  public cancelled: boolean;
  public contentType: ContentType;
  public isLowResolution: boolean;
  public accentColor: string | null;

  constructor(thumb: HTMLElement, isLowResolution: boolean = false) {
    this.id = thumb.id;
    this.thumb = thumb;
    this.bitmap = null;
    this.abortController = new AbortController();
    this.cancelled = false;
    this.contentType = getContentTypeFromThumb(thumb);
    this.isLowResolution = isLowResolution;
    this.accentColor = null;
  }

  public get megabytes(): number {
    return 0 / 220000;
  }

  public get isImage(): boolean {
    return this.contentType === "image";
  }

  public get isAnimated(): boolean {
    return !this.isImage;
  }

  public get isIncomplete(): boolean {
    return this.bitmap === null;
  }

  public get hasCompleted(): boolean {
    return !this.isIncomplete;
  }

  public get isOriginalResolution(): boolean {
    return !this.isLowResolution;
  }

  public complete(bitmap: ImageBitmap): void {
    this.bitmap = bitmap;
  }

  public cancel(): void {
    this.cancelled = true;
    this.abortController.abort();
  }

  public async close(): Promise<void> {
    if (this.bitmap instanceof ImageBitmap) {
      await IMAGE_BITMAP_CLOSE_QUEUE.wait();
      this.bitmap.close();
    }
  }

}
