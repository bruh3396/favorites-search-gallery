import { FeatureBridge } from "@/app/channels/feature_bridge";
import { GalleryConfig } from "@/config/gallery_config";
import { MediaType } from "@/types/media";
import { ThrottledQueue } from "@/lib/async/throttled_queue";
import { getPreviewUrl } from "@/lib/thumb/thumbs";
import { getTagSetFromItem } from "@/lib/thumb/thumb_tags";
import { resolveMediaType } from "@/lib/media/media_type_resolver";

const bitmapCloseQueue = new ThrottledQueue(GalleryConfig.bitmapCloseDelay);

export function getFavoritePixelCount(id: string): number {
  const favorite = FeatureBridge.getFavorite.call(id);
  return favorite ? favorite.metrics.width * favorite.metrics.height : 0;
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
    this.thumbUrl = getPreviewUrl(thumb) ?? "";
    this.thumb = thumb;
    this.bitmap = null;
    this.abortController = new AbortController();
    this.cancelled = false;
    this.mediaType = resolveMediaType(getTagSetFromItem(thumb));
    this.accentColor = null;
  }

  public get megabytes(): number {
    return getFavoritePixelCount(this.id) / 220_000;
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
    await bitmapCloseQueue.wait();

    if (this.bitmap instanceof ImageBitmap) {
      this.bitmap.close();
    }
  }
}
