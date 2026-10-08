import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";
import { MediaSequence } from "@/core/contracts/media_sequence";

export class Lightbox<T extends MediaItem> {
  private readonly currentItem = new Signal<T | undefined>(undefined);
  private readonly isOpenState = computed(() => this.currentItem.value !== undefined);
  private readonly neighborItems = new Signal<readonly T[]>([]);
  private sequence: MediaSequence<T> | undefined;

  public get isOpen(): Readable<boolean> {
    return this.isOpenState;
  }

  public get current(): Readable<T | undefined> {
    return this.currentItem;
  }

  public get neighbors(): Readable<readonly T[]> {
    return this.neighborItems;
  }

  public open(item: T, sequence: MediaSequence<T>): void {
    this.sequence = sequence;
    this.currentItem.value = item;
    this.findNeighbors().catch(console.error);
  }

  public close(): void {
    this.sequence = undefined;
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
    const sequence = this.sequence;

    if (current === undefined || sequence === undefined) {
      return;
    }
    const neighbor = await getNeighbor(sequence, current);

    if (neighbor !== undefined && this.isShowing(current, sequence)) {
      this.currentItem.value = neighbor;
      await this.findNeighbors();
    }
  }

  private async findNeighbors(): Promise<void> {
    const current = this.currentItem.peek();
    const sequence = this.sequence;

    if (current === undefined || sequence === undefined) {
      return;
    }
    const found: (T | undefined)[] = await Promise.all([sequence.getPrevious(current), sequence.getNext(current)]);

    if (this.isShowing(current, sequence)) {
      this.neighborItems.value = [...new Set(found)].filter((item): item is T => item !== undefined && item !== current);
    }
  }

  private isShowing(item: T, sequence: MediaSequence<T>): boolean {
    return this.currentItem.peek() === item && this.sequence === sequence;
  }
}
