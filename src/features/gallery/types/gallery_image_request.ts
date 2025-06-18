import { ContentType } from "../../../types/primitives/primitives";
import { ThrottledQueue } from "../../../components/functional/throttled_queue";
import { getContentTypeFromThumb } from "../../../utils/dom/tags";
import { getFavorite } from "../../favorites/types/favorite/favorite_item";
import { getURLFromThumb } from "../../../utils/dom/dom";

const IMAGE_BITMAP_CLOSE_QUEUE = new ThrottledQueue(200);

export function getFavoritePixelCount(id: string): number {
  const favorite = getFavorite(id);

  if (favorite === undefined) {
    return 0;
  }
  return favorite.metrics.width * favorite.metrics.height;
}

export class ImageRequest {
  public id: string;
  public thumbURL: string;
  public thumb: HTMLElement;
  public bitmap: ImageBitmap | null;
  public abortController: AbortController;
  public cancelled: boolean;
  public contentType: ContentType;
  public isLowResolution: boolean;
  public accentColor: string | null;

  constructor(thumb: HTMLElement, isLowResolution: boolean = false) {
    this.id = thumb.id;
    this.thumbURL = getURLFromThumb(thumb) ?? "";
    this.thumb = thumb;
    this.bitmap = null;
    this.abortController = new AbortController();
    this.cancelled = false;
    this.contentType = getContentTypeFromThumb(thumb);
    this.isLowResolution = isLowResolution;
    this.accentColor = null;
  }

  public get megabytes(): number {
    return getFavoritePixelCount(this.id) / 220000;
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

  public stop(): void {
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
