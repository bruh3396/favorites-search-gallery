import { DebouncedTask, createDebouncedTask } from "@/core/utils/async/debouncer";
import { MediaItem } from "@/core/domain/post/post";
import { MorphSource } from "@/core/boundary/ports/morpher/morpher";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export const LightboxRendererClass = {
  root: "fsg-LightboxRenderer",
  media: "fsg-LightboxMedia"
} as const;

export interface LightboxStageRenderer {
  readonly root: HTMLElement;
  readonly shownMedia: MorphSource | undefined;
  show(item: MediaItem): void;
  clear(): void;
  setNeighbors(items: readonly MediaItem[]): void;
  dispose(): void;
}

const PRELOAD_SETTLE_DELAY = 75;

export abstract class PreloadingRenderer {
  private neighbors: readonly MediaItem[] = [];
  private readonly preloadNeighborsDebounced: DebouncedTask<[]>;

  constructor(scheduler: Pick<Scheduler, "schedule">) {
    this.preloadNeighborsDebounced = createDebouncedTask(
      { delay: PRELOAD_SETTLE_DELAY, leading: false },
      scheduler,
      () => this.preloadNeighbors(this.neighbors)
    );
  }

  public setNeighbors(items: readonly MediaItem[]): void {
    this.neighbors = items;
    this.preloadNeighborsDebounced.cancel();

    if (items.length > 0) {
      this.preloadNeighborsDebounced();
    }
  }

  protected disposePreloading(): void {
    this.preloadNeighborsDebounced.cancel();
    this.neighbors = [];
  }

  protected getNeighbors(): readonly MediaItem[] {
    return this.neighbors;
  }

  protected abstract preloadNeighbors(items: readonly MediaItem[]): void;
}
