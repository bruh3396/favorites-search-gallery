import { LightboxDependencies, LightboxIntents } from "@/core/features/lightbox/types/lightbox";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";

export type LightboxNavigationFlowDependencies<T extends MediaItem> = Pick<LightboxDependencies<T>, "mediaSequence">;

export class LightboxNavigationFlow<T extends MediaItem> implements LightboxIntents<T> {
  private readonly currentItem = new Signal<T | undefined>(undefined);
  private readonly isOpenState = computed(() => this.currentItem.value !== undefined);

  constructor(private readonly dependencies: LightboxNavigationFlowDependencies<T>) { }

  public get isOpen(): Readable<boolean> {
    return this.isOpenState;
  }

  public get current(): Readable<T | undefined> {
    return this.currentItem;
  }

  public open(item: T): void {
    this.currentItem.value = item;
  }

  public close(): void {
    this.currentItem.value = undefined;
  }

  public showNext(): Promise<void> {
    return this.showNeighbor(current => this.dependencies.mediaSequence.getNext(current));
  }

  public showPrevious(): Promise<void> {
    return this.showNeighbor(current => this.dependencies.mediaSequence.getPrevious(current));
  }

  private async showNeighbor(getNeighbor: (current: T) => Promise<T | undefined>): Promise<void> {
    const current = this.currentItem.peek();

    if (current === undefined) {
      return;
    }
    const neighbor = await getNeighbor(current);

    if (neighbor !== undefined && this.currentItem.peek() === current) {
      this.currentItem.value = neighbor;
    }
  }
}
