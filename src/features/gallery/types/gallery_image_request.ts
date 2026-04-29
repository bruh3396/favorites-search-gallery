import { FeatureBridge } from "../../../lib/communication/features/feature_bridge";
import { MediaType } from "../../../types/media";
import { ThrottledQueue } from "../../../lib/core/concurrency/throttled_queue";
import { getPreviewURL } from "../../../lib/ui/dom";
import { getTagSetFromItem } from "../../../lib/dom/tags";
import { resolveMediaType } from "../../../lib/media_resolver";

const IMAGE_BITMAP_CLOSE_QUEUE = new ThrottledQueue(100);

export function getFavoritePixelCount(id: string): number {
  const favorite = FeatureBridge.allFavorites.query(id);

  if (favorite === undefined) {
    return 0;
  }
  return favorite.metrics.width * favorite.metrics.height;
}

export class ImageRequest {
  public id: string;
  public thumbUrl: string;
  public thumb: HTMLElement;
  public bitmap: ImageBitmap | null;
  public abortController: AbortController;
  public cancelled: boolean;
  public mediaType: MediaType;
  public accentColor: string | null;

  constructor(thumb: HTMLElement) {
    this.id = thumb.id;
    this.thumbUrl = getPreviewURL(thumb) ?? "";
    this.thumb = thumb;
    this.bitmap = null;
    this.abortController = new AbortController();
    this.cancelled = false;
    this.mediaType = resolveMediaType(getTagSetFromItem(thumb));
    this.accentColor = null;
  }

  public get megabytes(): number {
    return getFavoritePixelCount(this.id) / 220000;
  }

  public get isImage(): boolean {
    return this.mediaType === "image";
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

  public get isHighRes(): boolean {
    return true;
  }

  public get isLowRes(): boolean {
    return !this.isHighRes;
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
