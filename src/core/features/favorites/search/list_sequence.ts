import { MediaSequence, SequencePosition } from "@/core/domain/media/media_sequence";
import { getItemsAround, getWrappedItemsAround } from "@/core/utils/collection/array";
import { MediaItem } from "@/core/domain/post/post";
import { Readable } from "@/core/utils/reactive/signal";

export interface ListSequenceConfiguration {
  readonly wraps: boolean;
}

export class ListSequence<T extends MediaItem> implements MediaSequence<T> {
  constructor(private readonly configuration: ListSequenceConfiguration, private readonly list: Readable<readonly T[]>) { }

  public getNext(item: T): Promise<T | undefined> {
    return Promise.resolve(this.getNeighbor(item, 1));
  }

  public getPrevious(item: T): Promise<T | undefined> {
    return Promise.resolve(this.getNeighbor(item, -1));
  }

  public getNeighbors(item: T, count: number): Promise<readonly T[]> {
    const items = this.list.peek();
    const index = items.indexOf(item);
    const around = this.configuration.wraps ? getWrappedItemsAround(items, index, count + 1) : getItemsAround(items, index, count + 1);
    return Promise.resolve(around.slice(1));
  }

  public positionOf(item: T): SequencePosition | undefined {
    const items = this.list.value;
    const index = items.indexOf(item);
    return index === -1 ? undefined : { index, total: items.length };
  }

  private getNeighbor(item: T, offset: number): T | undefined {
    const items = this.list.peek();
    const index = items.indexOf(item);

    if (index === -1) {
      return undefined;
    }
    const next = index + offset;
    return this.configuration.wraps ? items[(next + items.length) % items.length] : items[next];
  }
}
