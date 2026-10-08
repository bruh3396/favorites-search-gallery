import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";
import { MediaSequence } from "@/core/contracts/media_sequence";

export class Lightbox<T extends MediaItem> {
  private readonly currentItem = new Signal<T | undefined>(undefined);
  private readonly isOpenState = computed(() => this.currentItem.value !== undefined);
  private sequence: MediaSequence<T> | undefined;

  public get isOpen(): Readable<boolean> {
    return this.isOpenState;
  }

  public get current(): Readable<T | undefined> {
    return this.currentItem;
  }

  public open(item: T, sequence: MediaSequence<T>): void {
    this.sequence = sequence;
    this.currentItem.value = item;
  }

  public close(): void {
    this.sequence = undefined;
    this.currentItem.value = undefined;
  }

  public showNext(): Promise<void> {
    return this.showNeighbor((sequence, current) => sequence.getNext(current));
  }

  public showPrevious(): Promise<void> {
    return this.showNeighbor((sequence, current) => sequence.getPrevious(current));
  }

  private async showNeighbor(getNeighbor: (sequence: MediaSequence<T>, current: T) => Promise<T | undefined>): Promise<void> {
    const current = this.currentItem.peek();
    const sequence = this.sequence;

    if (current === undefined || sequence === undefined) {
      return;
    }
    const neighbor = await getNeighbor(sequence, current);

    if (neighbor !== undefined && this.currentItem.peek() === current && this.sequence === sequence) {
      this.currentItem.value = neighbor;
    }
  }
}
