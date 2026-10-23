import { DebouncedTask, createDebouncedTask } from "@/core/utils/async/debouncer";
import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";
import { MediaSequence, SequencePosition } from "@/core/domain/media/media_sequence";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface LightboxNavigationConfiguration {
  readonly settleDelay: number;
}

interface State<T extends MediaItem> {
  readonly current: T;
  readonly sequence: MediaSequence<T>;
}

export class LightboxNavigation<T extends MediaItem> {
  private readonly state = new Signal<State<T> | undefined>(undefined);
  private readonly isOpenState = computed(() => this.state.value !== undefined);
  private readonly currentItemState = computed(() => this.state.value?.current);
  private readonly sequenceState = computed(() => this.state.value?.sequence);
  private readonly positionState = computed(() => {
    const state = this.state.value;
    return state?.sequence.positionOf(state.current);
  });
  private readonly settledEmitter = new Emitter<T>();
  private readonly closedEmitter = new Emitter<T>();
  private readonly settle: DebouncedTask<[T]>;

  constructor(configuration: LightboxNavigationConfiguration, scheduler: Pick<Scheduler, "schedule">) {
    this.settle = createDebouncedTask({ delay: configuration.settleDelay, leading: false }, scheduler, (item: T) => this.settledEmitter.emit(item));
  }

  public get isOpen(): Readable<boolean> {
    return this.isOpenState;
  }

  public get currentItem(): Readable<T | undefined> {
    return this.currentItemState;
  }

  public get sequence(): Readable<MediaSequence<T> | undefined> {
    return this.sequenceState;
  }

  public get position(): Readable<SequencePosition | undefined> {
    return this.positionState;
  }

  public get settled(): Occurrence<T> {
    return this.settledEmitter;
  }

  public get closed(): Occurrence<T> {
    return this.closedEmitter;
  }

  public open(sequence: MediaSequence<T>, item: T): void {
    this.state.value = { current: item, sequence };
    this.settle(item);
  }

  public close(): void {
    const state = this.state.peek();

    if (state === undefined) {
      return;
    }
    this.state.value = undefined;
    this.settle.cancel();
    this.closedEmitter.emit(state.current);
  }

  public dispose(): void {
    this.settle.cancel();
    this.state.value = undefined;
  }

  public goToNext(): Promise<void> {
    return this.goToNeighbor((sequence, item) => sequence.getNext(item));
  }

  public goToPrevious(): Promise<void> {
    return this.goToNeighbor((sequence, item) => sequence.getPrevious(item));
  }

  private async goToNeighbor(find: (sequence: MediaSequence<T>, item: T) => Promise<T | undefined>): Promise<void> {
    const before = this.state.peek();

    if (before === undefined) {
      return;
    }
    const neighbor = await find(before.sequence, before.current);

    if (neighbor !== undefined && this.state.peek() === before) {
      this.state.value = { ...before, current: neighbor };
      this.settle(neighbor);
    }
  }
}
