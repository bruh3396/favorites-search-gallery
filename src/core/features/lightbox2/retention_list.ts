import { Readable, Signal } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";
import { haveSameItems } from "@/core/utils/collection/array";

export interface LightboxRetentionListConfiguration {
  readonly capacity: number;
}

export class LightboxRetentionList<T extends MediaItem> {
  private readonly itemsState = new Signal<readonly T[]>([]);

  constructor(private readonly configuration: LightboxRetentionListConfiguration) { }

  public get items(): Readable<readonly T[]> {
    return this.itemsState;
  }

  public retain(items: readonly T[]): void {
    const previous = this.itemsState.peek();
    const next = [...new Set([...items, ...previous])].slice(0, this.configuration.capacity);

    if (!haveSameItems(previous, next)) {
      this.itemsState.value = next;
    }
  }
}
