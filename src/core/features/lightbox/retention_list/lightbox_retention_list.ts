import { Readable, Signal } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/media/media_item";
import { MediaSequence } from "@/core/domain/media/media_sequence";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { haveSameItems } from "@/core/utils/collection/array_utilities";

export interface LightboxRetentionListConfiguration {
  readonly capacity: number;
}

export interface LightboxRetentionListDependencies<T extends MediaItem> {
  settled: Occurrence<T>;
  sequence: Readable<MediaSequence<T> | undefined>;
}

export class LightboxRetentionList<T extends MediaItem> {
  private readonly itemsState = new Signal<readonly T[]>([]);
  private readonly stopRetainingNeighbors: () => void;

  constructor(private readonly configuration: LightboxRetentionListConfiguration, dependencies: LightboxRetentionListDependencies<T>) {
    this.stopRetainingNeighbors = dependencies.settled.on(item => {
      dependencies.sequence.peek()?.getNeighbors(item, configuration.capacity - 1)
        .then(neighbors => this.retain([item, ...neighbors]))
        .catch(console.error);
    });
  }

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

  public dispose(): void {
    this.stopRetainingNeighbors();
  }
}
