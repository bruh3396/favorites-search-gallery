import { Readable, effect } from "@/core/utils/reactive/signal";
import { Favorite } from "@/core/features/favorites/favorite";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Size } from "@/core/utils/geometry/size";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { createDebouncedTask } from "@/core/utils/async/debounced_task";

export interface FavoriteSizeRecorderConfiguration {
  readonly measuredCount: number;
  readonly recordDelay: number;
}

export interface FavoriteSizeRecorderDependencies {
  sizes: StoredValue<readonly Size[]>;
  scheduler: Pick<Scheduler, "schedule">;
  results: Readable<readonly Favorite[]>;
}

export class FavoriteSizeRecorder {
  private readonly measuredCount: number;
  readonly #sizes: StoredValue<readonly Size[]>;

  constructor({ measuredCount, recordDelay }: FavoriteSizeRecorderConfiguration, { sizes, scheduler, results }: FavoriteSizeRecorderDependencies) {
    this.measuredCount = measuredCount;
    this.#sizes = sizes;
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
    return this.#sizes.peek();
  }

  public record(favorites: readonly Favorite[]): void {
    const sizes = measure(favorites.slice(0, this.measuredCount));

    if (sizes.length > 0 && !sameSizes(sizes, this.#sizes.peek())) {
      this.#sizes.set(sizes);
    }
  }
}

function sameSizes(firstSizes: readonly Size[], secondSizes: readonly Size[]): boolean {
  return firstSizes.length === secondSizes.length && firstSizes.every((size, index) => size.width === secondSizes[index].width && size.height === secondSizes[index].height);
}

function measure(favorites: readonly Favorite[]): Size[] {
  return favorites.map(favorite => ({ width: favorite.getMetric("width"), height: favorite.getMetric("height") }));
}
