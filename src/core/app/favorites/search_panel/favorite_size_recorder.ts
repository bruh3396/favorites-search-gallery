import { Readable, effect } from "@/core/utils/reactive/signal";
import { Favorite } from "@/core/features/favorites/favorite";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Size } from "@/core/utils/geometry/size";
import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { createDebouncedTask } from "@/core/utils/async/debounced_task";

export interface FavoriteSizeRecorderConfiguration {
  readonly measuredCount: number;
  readonly recordDelay: number;
}

export interface FavoriteSizeRecorderDependencies {
  storedSizes: StoredValue<readonly Size[]>;
  scheduler: Pick<Scheduler, "schedule">;
  results: Readable<readonly Favorite[]>;
}

export class FavoriteSizeRecorder {
  private readonly storedSizes: StoredValue<readonly Size[]>;
  private readonly measuredCount: number;

  constructor({ measuredCount, recordDelay }: FavoriteSizeRecorderConfiguration, { storedSizes, scheduler, results }: FavoriteSizeRecorderDependencies) {
    this.measuredCount = measuredCount;
    this.storedSizes = storedSizes;
    const recordDebounced = createDebouncedTask(
      { delay: recordDelay, leading: false }, scheduler,
      (favorites: readonly Favorite[]) => this.record(favorites)
    );

    effect(() => {
      const favorites = results.value;

      if (favorites.length > 0) {
        recordDebounced(favorites);
      } else {
        recordDebounced.cancel();
      }
    });
  }

  public get sizes(): readonly Size[] {
    return this.storedSizes.peek();
  }

  public record(favorites: readonly Favorite[]): void {
    const sizes = measure(favorites.slice(0, this.measuredCount));

    if (sizes.length > 0 && !sameSizes(sizes, this.storedSizes.peek())) {
      this.storedSizes.set(sizes);
    }
  }
}

function sameSizes(first: readonly Size[], second: readonly Size[]): boolean {
  return first.length === second.length && first.every((size, index) => size.width === second[index].width && size.height === second[index].height);
}

function measure(favorites: readonly Favorite[]): Size[] {
  return favorites.map(favorite => ({ width: favorite.getMetric("width"), height: favorite.getMetric("height") }));
}
