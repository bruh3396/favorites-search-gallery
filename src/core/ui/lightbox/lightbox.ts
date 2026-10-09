import { MediaSequence, SequencePosition } from "@/core/contracts/media_sequence";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";

const NEIGHBOR_COUNT = 1;

export class Lightbox<T extends MediaItem> {
  private readonly currentItem = new Signal<T | undefined>(undefined);
  private readonly isOpenState = computed(() => this.currentItem.value !== undefined);
  private readonly neighborItems = new Signal<readonly T[]>([]);
  private readonly sequence = new Signal<MediaSequence<T> | undefined>(undefined);
  private readonly positionState = computed(() => findPosition(this.currentItem.value, this.sequence.value));

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

  public open(item: T, sequence: MediaSequence<T>): void {
    this.sequence.value = sequence;
    this.currentItem.value = item;
    this.publishNeighbors(NEIGHBOR_COUNT).catch(console.error);
  }

  public close(): void {
    this.sequence.value = undefined;
    this.currentItem.value = undefined;
    this.neighborItems.value = [];
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
      await this.publishNeighbors(NEIGHBOR_COUNT);
    }
  }

private async publishNeighbors(length: number): Promise<void> {
  const current = this.currentItem.peek();
  const sequence = this.sequence.peek();

  if (current === undefined || sequence === undefined) {
    return;
  }

  const found: T[] = [];

  let previous: T | undefined = current;
  let next: T | undefined = current;

  for (let i = 0; i < length; i += 1) {
    [previous, next] = await Promise.all([
      previous ? sequence.getPrevious(previous) : Promise.resolve(undefined),
      next ? sequence.getNext(next) : Promise.resolve(undefined)
    ]);

    if (previous !== undefined) {
      found.push(previous);
    }

    if (next !== undefined) {
      found.push(next);
    }
  }

  if (this.isShowing(current, sequence)) {
    this.neighborItems.value = [...new Set(found.filter(item => item !== current))];
  }
}

  private isShowing(item: T, sequence: MediaSequence<T>): boolean {
    return this.currentItem.peek() === item && this.sequence.peek() === sequence;
  }
}

function findPosition<T extends MediaItem>(item: T | undefined, sequence: MediaSequence<T> | undefined): SequencePosition | undefined {
  return item === undefined || sequence === undefined ? undefined : sequence.positionOf(item);
}
