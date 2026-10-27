import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { KeyedStoredValue } from "@/core/utils/stored_value/keyed_stored_value";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { hasFields, isNumber } from "@/core/utils/guard/guard";
import { Size } from "@/core/utils/geometry/size";
import { Favorite } from "@/core/features/favorites/favorite";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { createDebouncedTask } from "@/core/utils/async/debounced_task";
import { createGuardedCodec } from "@/core/utils/codec/codec";

const FAVORITE_SIZES_NAMESPACE = "favoriteSizes";

export interface FavoriteSizeRecorderConfiguration {
  readonly ownerId: string;
  readonly measuredCount: number;
  readonly recordDelay: number;
  readonly fallbackCount: number;
}

export interface FavoriteSizeRecorderDependencies {
  storage: LocalKeyedValues;
  scheduler: Pick<Scheduler, "schedule">;
  results: Readable<readonly Favorite[]>;
}

export class FavoriteSizeRecorder {
  private readonly stored: StoredValue<readonly Size[]>;
  private readonly measuredCount: number;

  constructor(
    { ownerId, measuredCount, recordDelay, fallbackCount }: FavoriteSizeRecorderConfiguration,
    { storage, scheduler, results }: FavoriteSizeRecorderDependencies
  ) {
    this.measuredCount = measuredCount;
    this.stored = new KeyedStoredValue(
      { key: ownerId, defaultValue: Array.from({ length: fallbackCount }, () => ({ width: 1, height: 1 })) },
      { storage: new NamespacedLocalKeyedValues(FAVORITE_SIZES_NAMESPACE, storage), codec: createGuardedCodec(isSizeList) }
    );
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
    return this.stored.peek();
  }

  public record(favorites: readonly Favorite[]): void {
    const sizes = measure(favorites.slice(0, this.measuredCount));

    if (sizes.length > 0 && !sameSizes(sizes, this.stored.peek())) {
      this.stored.set(sizes);
    }
  }
}

function sameSizes(first: readonly Size[], second: readonly Size[]): boolean {
  return first.length === second.length && first.every((size, index) => size.width === second[index].width && size.height === second[index].height);
}

function measure(favorites: readonly Favorite[]): Size[] {
  return favorites.map(favorite => ({ width: favorite.getMetric("width"), height: favorite.getMetric("height") }));
}

function isSizeList(stored: unknown): stored is readonly Size[] {
  return Array.isArray(stored) && stored.every(hasFields<Size>({ width: isNumber, height: isNumber }));
}
