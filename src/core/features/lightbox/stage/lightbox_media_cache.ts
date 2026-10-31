import { Media } from "@/core/domain/media/media";
import { MediaKind } from "@/core/domain/media/media_kind";
import { Readable, Signal } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/media/media_item";

export interface LightboxMediaCacheConfiguration {
  readonly kind: MediaKind;
  readonly capacity?: number;
}

export interface LightboxMediaCacheDependencies<V> {
  load: (media: Media, signal: AbortSignal) => Promise<V>;
  release?: (value: V) => void;
}

export class LightboxMediaCache<V> {
  private readonly cache = new Signal<ReadonlyMap<string, V>>(new Map());
  private readonly pending = new Map<string, AbortController>();
  private readonly release: (value: V) => void;

  constructor(private readonly configuration: LightboxMediaCacheConfiguration, private readonly dependencies: LightboxMediaCacheDependencies<V>) {
    this.release = dependencies.release ?? ((): void => { });
  }

  public get loaded(): Readable<ReadonlyMap<string, V>> {
    return this.cache;
  }

  public retain(mediaItems: readonly MediaItem[]): void {
    const retainedMediaItems = mediaItems.filter(mediaItem => mediaItem.media.kind === this.configuration.kind).slice(0, this.configuration.capacity);

    this.evictAllExcept(new Set(retainedMediaItems.map(mediaItem => mediaItem.id)));
    retainedMediaItems.forEach(mediaItem => this.load(mediaItem));
  }

  public dispose(): void {
    this.retain([]);
  }

  private evictAllExcept(retained: ReadonlySet<string>): void {
    for (const [id, controller] of this.pending) {
      if (!retained.has(id)) {
        controller.abort();
        this.pending.delete(id);
      }
    }
    const loaded = this.cache.peek();
    const evicted = [...loaded].filter(([id]) => !retained.has(id));

    if (evicted.length === 0) {
      return;
    }
    this.cache.value = new Map([...loaded].filter(([id]) => retained.has(id)));
    evicted.forEach(([, value]) => this.release(value));
  }

  private load(mediaItem: MediaItem): void {
    if (this.cache.peek().has(mediaItem.id) || this.pending.has(mediaItem.id)) {
      return;
    }
    const controller = new AbortController();

    this.pending.set(mediaItem.id, controller);
    this.dependencies.load(mediaItem.media, controller.signal).then(
      value => {
        if (controller.signal.aborted) {
          this.release(value);
          return;
        }
        this.pending.delete(mediaItem.id);
        this.cache.value = new Map(this.cache.peek()).set(mediaItem.id, value);
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          this.pending.delete(mediaItem.id);
          console.error(error);
        }
      }
    );
  }
}
