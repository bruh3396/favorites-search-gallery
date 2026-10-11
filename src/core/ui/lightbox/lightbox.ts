import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";
import { MediaSequence, SequencePosition } from "@/core/domain/media/media_sequence";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";

export interface LightboxConfiguration {
  readonly warmLimit: number;
  readonly maxNeighborDistance: number;
}

export class Lightbox<T extends MediaItem> {
  private readonly currentItem = new Signal<T | undefined>(undefined);
  private readonly closes = new Emitter<T>();
  private readonly isOpenState = computed(() => this.currentItem.value !== undefined);
  private readonly neighborItems = new Signal<readonly T[]>([]);
  private readonly warmItemsState = new Signal<readonly T[]>([]);
  private readonly sequence = new Signal<MediaSequence<T> | undefined>(undefined);
  private readonly positionState = computed(() => findPosition(this.currentItem.value, this.sequence.value));

  constructor(private readonly configuration: LightboxConfiguration) { }

  public get closed(): Occurrence<T> {
    return this.closes;
  }

  public get isOpen(): Readable<boolean> {
    return this.isOpenState;
  }

  public get current(): Readable<T | undefined> {
    return this.currentItem;
  }

  public get neighbors(): Readable<readonly T[]> {
    return this.neighborItems;
  }

  public get position(): Readable<SequencePosition | undefined> {
    return this.positionState;
  }

  public get warmItems(): Readable<readonly T[]> {
    return this.warmItemsState;
  }

  public warm(item: T): void {
    const previous = this.warmItemsState.peek();

    if (this.currentItem.peek() !== undefined || previous[0] === item) {
      return;
    }
    this.warmItemsState.value = [item, ...previous.filter(warmItem => warmItem !== item)].slice(0, this.configuration.warmLimit);
  }

  public open(item: T, sequence: MediaSequence<T>): void {
    this.sequence.value = sequence;
    this.currentItem.value = item;
    this.warmItemsState.value = [];
    this.publishNeighbors(item, sequence).catch(console.error);
  }

  public close(): void {
    const item = this.currentItem.peek();

    this.sequence.value = undefined;
    this.currentItem.value = undefined;
    this.neighborItems.value = [];

    if (item !== undefined) {
      this.closes.emit(item);
    }
  }

  public showNext(): Promise<void> {
    return this.showNeighbor((sequence, current) => sequence.getNext(current));
  }

  public showPrevious(): Promise<void> {
    return this.showNeighbor((sequence, current) => sequence.getPrevious(current));
  }

  private async showNeighbor(getNeighbor: (sequence: MediaSequence<T>, current: T) => Promise<T | undefined>): Promise<void> {
    const current = this.currentItem.peek();
    const sequence = this.sequence.peek();

    if (current === undefined || sequence === undefined) {
      return;
    }
    const neighbor = await getNeighbor(sequence, current);

    if (neighbor !== undefined && this.isShowing(current, sequence)) {
      this.currentItem.value = neighbor;
      await this.publishNeighbors(neighbor, sequence);
    }
  }

  private async publishNeighbors(current: T, sequence: MediaSequence<T>): Promise<void> {
    const found = new Set<T>();
    const addNeighbor = (item: T | undefined): void => {
      if (item !== undefined && item !== current) {
        found.add(item);
      }
    };

    let previous: T | undefined = current;
    let next: T | undefined = current;

    for (let distanceFromCurrent = 1; distanceFromCurrent <= this.configuration.maxNeighborDistance; distanceFromCurrent += 1) {
      [previous, next] = await Promise.all([
        previous === undefined ? undefined : sequence.getPrevious(previous),
        next === undefined ? undefined : sequence.getNext(next)
      ]);

      addNeighbor(previous);
      addNeighbor(next);

      if (previous === undefined && next === undefined) {
        break;
      }
    }

    if (this.isShowing(current, sequence)) {
      this.neighborItems.value = [...found];
    }
  }

  private isShowing(item: T, sequence: MediaSequence<T>): boolean {
    return this.currentItem.peek() === item && this.sequence.peek() === sequence;
  }
}

function findPosition<T extends MediaItem>(item: T | undefined, sequence: MediaSequence<T> | undefined): SequencePosition | undefined {
  return item === undefined || sequence === undefined ? undefined : sequence.positionOf(item);
}
