import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { doNothing } from "@/core/utils/function/function";

interface Entry {
  bitmap: Promise<ImageBitmap | undefined>;
  abortController: AbortController;
}

export class BitmapCache {
  private readonly cache = new Map<string, Entry>();

  constructor(private readonly fetchOriginal: (media: Media) => Promise<Blob>) { }

  public has(id: string): boolean {
    return this.cache.has(id);
  }

  public load(item: MediaItem): Promise<ImageBitmap | undefined> {
    const cached = this.cache.get(item.id);

    if (cached !== undefined) {
      return cached.bitmap;
    }
    const abortController = new AbortController();
    const entry = { bitmap: this.decode(item.media, abortController.signal), abortController };

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

  private async decode(media: Media, signal: AbortSignal): Promise<ImageBitmap | undefined> {
    try {
      return createImageBitmap(await this.fetchOriginal(media));
    } catch (error) {
      if (signal.aborted) {
        return undefined;
      }
      throw error;
    }
  }

  private forget(id: string, entry: Entry): void {
    if (this.cache.get(id) === entry) {
      this.cache.delete(id);
    }
  }
}
