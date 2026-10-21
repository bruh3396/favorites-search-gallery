import { DebouncedTask, createDebouncedTask } from "@/core/utils/async/debouncer";
import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";
import { MediaSequence, SequencePosition } from "@/core/domain/media/media_sequence";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface LightboxNavigationConfiguration {
  readonly maxWarmItems: number;
  readonly maxNeighborDistance: number;
  readonly settleDelay: number;
}

export class LightboxNavigation<T extends MediaItem> {
  private readonly currentState = new Signal<T | undefined>(undefined);
  private readonly closedEmitter = new Emitter<T>();
  private readonly settledEmitter = new Emitter<T>();
  private readonly settle: DebouncedTask<[T]>;
  private readonly isOpenState = computed(() => this.currentState.value !== undefined);
  private readonly neighborsState = new Signal<readonly T[]>([]);
  private readonly warmItemsState = new Signal<readonly T[]>([]);
  private readonly sequenceState = new Signal<MediaSequence<T> | undefined>(undefined);
  private readonly positionState = computed(() => findPosition(this.currentState.value, this.sequenceState.value));

  constructor(private readonly configuration: LightboxNavigationConfiguration, scheduler: Pick<Scheduler, "schedule">) {
    this.settle = createDebouncedTask({ delay: configuration.settleDelay, leading: false }, scheduler, (item: T) => this.settledEmitter.emit(item));
  }

  public get closed(): Occurrence<T> {
    return this.closedEmitter;
  }

  public get settled(): Occurrence<T> {
    return this.settledEmitter;
  }

  public get isOpen(): Readable<boolean> {
    return this.isOpenState;
  }

  public get current(): Readable<T | undefined> {
    return this.currentState;
  }

  public get neighbors(): Readable<readonly T[]> {
    return this.neighborsState;
  }

  public get position(): Readable<SequencePosition | undefined> {
    return this.positionState;
  }

  public get warmItems(): Readable<readonly T[]> {
    return this.warmItemsState;
  }

  public warm(item: T): void {
    const previous = this.warmItemsState.peek();

    if (this.currentState.peek() !== undefined || previous[0] === item) {
      return;
    }
    this.warmItemsState.value = [item, ...previous.filter(warmItem => warmItem !== item)].slice(0, this.configuration.maxWarmItems);
  }

  public open(item: T, sequence: MediaSequence<T>): void {
    this.sequenceState.value = sequence;
    this.show(item);
    this.warmItemsState.value = [];
    this.publishNeighbors(item, sequence).catch(console.error);
  }

  public close(): void {
    const item = this.currentState.peek();

    this.sequenceState.value = undefined;
    this.currentState.value = undefined;
    this.settle.cancel();
    this.neighborsState.value = [];

    if (item !== undefined) {
      this.closedEmitter.emit(item);
    }
  }

  public showNext(): Promise<void> {
    return this.showNeighbor((sequence, current) => sequence.getNext(current));
  }

  public showPrevious(): Promise<void> {
    return this.showNeighbor((sequence, current) => sequence.getPrevious(current));
  }

  private async showNeighbor(getNeighbor: (sequence: MediaSequence<T>, current: T) => Promise<T | undefined>): Promise<void> {
    const current = this.currentState.peek();
    const sequence = this.sequenceState.peek();

    if (current === undefined || sequence === undefined) {
      return;
    }
    const neighbor = await getNeighbor(sequence, current);

    if (neighbor !== undefined && this.isShowing(current, sequence)) {
      this.show(neighbor);
      await this.publishNeighbors(neighbor, sequence);
    }
  }

  private show(item: T): void {
    this.currentState.value = item;
    this.settle(item);
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
      this.neighborsState.value = [...found];
    }
  }

  private isShowing(item: T, sequence: MediaSequence<T>): boolean {
    return this.currentState.peek() === item && this.sequenceState.peek() === sequence;
  }
}

function findPosition<T extends MediaItem>(item: T | undefined, sequence: MediaSequence<T> | undefined): SequencePosition | undefined {
  return item === undefined || sequence === undefined ? undefined : sequence.positionOf(item);
}
