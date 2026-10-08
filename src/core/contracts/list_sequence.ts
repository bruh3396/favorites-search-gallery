import { MediaItem } from "@/core/domain/post/post";
import { MediaSequence } from "@/core/contracts/media_sequence";
import { Readable } from "@/core/utils/reactive/signal";

export interface ListSequenceConfiguration {
  wraps: boolean;
}

export class ListSequence<T extends MediaItem> implements MediaSequence<T> {
  constructor(private readonly configuration: ListSequenceConfiguration, private readonly list: Readable<readonly T[]>) { }

  public getNext(item: T): Promise<T | undefined> {
    return Promise.resolve(this.getNeighbor(item, 1));
  }

  public getPrevious(item: T): Promise<T | undefined> {
    return Promise.resolve(this.getNeighbor(item, -1));
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
