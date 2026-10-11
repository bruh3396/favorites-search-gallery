import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { doNothing } from "@/core/utils/function/function";

interface Entry {
  readonly bitmap: Promise<ImageBitmap | undefined>;
  readonly abortController: AbortController;
}

interface BitmapCacheDependencies {
  fetchOriginal: (media: Media, signal: AbortSignal) => Promise<Blob>;
  resolveOriginalImageFallbackUrl: (media: Media) => Promise<string>;
  bitmapDecoder: BitmapDecoder;
}

export class BitmapCache {
  private readonly cache = new Map<string, Entry>();
  private readonly fallbackIds = new Set<string>();

  constructor(private readonly dependencies: BitmapCacheDependencies) { }

  public has(id: string): boolean {
    return this.cache.has(id);
  }

  public load(item: MediaItem): Promise<ImageBitmap | undefined> {
    const cached = this.cache.get(item.id);

    if (cached !== undefined) {
      return cached.bitmap;
    }
    const abortController = new AbortController();
    const entry = { bitmap: Promise.resolve().then(() => this.decode(item.id, item.media, abortController.signal)), abortController };

    this.cache.set(item.id, entry);
    entry.bitmap.catch(() => this.forget(item.id, entry));
    return entry.bitmap;
  }

  public keepOnly(items: readonly MediaItem[]): void {
    const kept = new Set(items.map(item => item.id));

    for (const [id, entry] of this.cache) {
      if (!kept.has(id)) {
        this.cache.delete(id);
        entry.abortController.abort();
        entry.bitmap.then(bitmap => bitmap?.close()).catch(doNothing);
      }
    }
  }

  private async decode(id: string, media: Media, signal: AbortSignal): Promise<ImageBitmap | undefined> {
    try {
      if (signal.aborted) {
        return undefined;
      }
      let source: ImageBitmapSource;
      let needsFallback = this.fallbackIds.has(id);

      if (needsFallback) {
        source = await this.loadFallbackImage(media, signal);
      } else {
        try {
          source = await this.dependencies.fetchOriginal(media, signal);
        } catch {
          if (signal.aborted) {
            return undefined;
          }
          source = await this.loadFallbackImage(media, signal);
          needsFallback = true;
        }
      }

      if (signal.aborted) {
        return undefined;
      }
      const bitmap = await this.dependencies.bitmapDecoder.decode(source);

      if (signal.aborted) {
        bitmap.close();
        return undefined;
      }

      if (needsFallback) {
        this.fallbackIds.add(id);
      }
      return bitmap;
    } catch (error) {
      if (signal.aborted) {
        return undefined;
      }
      throw error;
    }
  }

  private async loadFallbackImage(media: Media, signal: AbortSignal): Promise<HTMLImageElement> {
    const url = await this.dependencies.resolveOriginalImageFallbackUrl(media);
    return loadImage(url, signal);
  }

  private forget(id: string, entry: Entry): void {
    if (this.cache.get(id) === entry) {
      this.cache.delete(id);
    }
  }
}

function loadImage(url: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = (): void => {
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
      signal.removeEventListener("abort", onAbort);
    };
    const onLoad = (): void => {
      cleanup();
      resolve(image);
    };
    const onError = (): void => {
      cleanup();
      reject(new Error(`Could not load original image: ${url}`));
    };
    const onAbort = (): void => {
      cleanup();
      image.removeAttribute("src");
      reject(new DOMException("Image load aborted", "AbortError"));
    };

    if (signal.aborted) {
      onAbort();
      return;
    }
    image.addEventListener("load", onLoad, { once: true });
    image.addEventListener("error", onError, { once: true });
    signal.addEventListener("abort", onAbort, { once: true });
    image.src = url;
  });
}
