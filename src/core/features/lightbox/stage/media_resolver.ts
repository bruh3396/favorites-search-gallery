import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { Signal } from "@/core/utils/reactive/signal";

export class LightboxMediaResolver {
  private readonly resolved: Signal<ReadonlyMap<string, Media>>;
  private readonly resolving: Set<string>;
  private readonly correctedItems: Emitter<MediaItem>;

  constructor(private readonly resolveMedia: (media: Media) => Promise<Media>) {
    this.resolved = new Signal<ReadonlyMap<string, Media>>(new Map());
    this.resolving = new Set();
    this.correctedItems = new Emitter();
  }

  public get corrected(): Occurrence<MediaItem> {
    return this.correctedItems;
  }

  public resolve(items: readonly MediaItem[]): void {
    items.forEach(item => this.resolveOne(item));
  }

  public readResolved(items: readonly MediaItem[]): MediaItem[] {
    return items.flatMap(({ id }) => {
      const media = this.resolved.value.get(id);
      return media === undefined ? [] : [{ id, media }];
    });
  }

  public readMedia(id: string): Media | undefined {
    return this.resolved.value.get(id);
  }

  private resolveOne({ id, media }: MediaItem): void {
    if (this.resolving.has(id) || this.resolved.peek().has(id)) {
      return;
    }
    this.resolving.add(id);
    this.resolveMedia(media).catch(() => media).then(resolved => {
      this.resolving.delete(id);
      this.resolved.value = new Map(this.resolved.peek()).set(id, resolved);

      if (resolved.kind !== media.kind) {
        this.correctedItems.emit({ id, media: resolved });
      }
    });
  }
}
