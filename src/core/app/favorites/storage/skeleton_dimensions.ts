import { Preference } from "@/core/utils/preference/preference";
import { StoredPreference } from "@/core/utils/preference/stored_preference";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { hasFields, isNumber } from "@/core/utils/guard/guard";
import { Size } from "@/core/utils/geometry/size";
import { Favorite } from "@/core/features/favorites/favorite";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { createDebouncedTask } from "@/core/utils/async/debounced_task";
import { createGuardedCodec } from "@/core/utils/codec/codec";

const SKELETON_NAMESPACE = "favoritesSkeleton";
const MEASURED_COUNT = 50;
const SKELETON_RECORD_DELAY = 500;

export const DEFAULT_SKELETON_DIMENSIONS: readonly Size[] = Array.from({ length: 24 }, () => ({ width: 1, height: 1 }));

export interface SkeletonDimensionsConfiguration {
  readonly ownerId: string;
}

export interface SkeletonDimensionsDependencies {
  storage: LocalKeyedValues;
  scheduler: Pick<Scheduler, "schedule">;
  results: Readable<readonly Favorite[]>;
}

export class SkeletonDimensions {
  private readonly stored: Preference<readonly Size[]>;

  constructor({ ownerId }: SkeletonDimensionsConfiguration, { storage, scheduler, results }: SkeletonDimensionsDependencies) {
    this.stored = new StoredPreference(
      { key: ownerId, defaultValue: DEFAULT_SKELETON_DIMENSIONS },
      { storage: new NamespacedLocalKeyedValues(SKELETON_NAMESPACE, storage), codec: createGuardedCodec(isDimensionsList) }
    );
    const recordDebounced = createDebouncedTask(
      { delay: SKELETON_RECORD_DELAY, leading: false }, scheduler,
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

  public get value(): readonly Size[] {
    return this.stored.peek();
  }

  public record(favorites: readonly Favorite[]): void {
    const dimensions = measure(favorites);

    if (dimensions.length > 0 && !sameDimensions(dimensions, this.stored.peek())) {
      this.stored.set(dimensions);
    }
  }
}

function sameDimensions(first: readonly Size[], second: readonly Size[]): boolean {
  return first.length === second.length && first.every((dimensions, index) => dimensions.width === second[index].width && dimensions.height === second[index].height);
}

function measure(favorites: readonly Favorite[]): Size[] {
  return favorites
    .slice(0, MEASURED_COUNT)
    .map(favorite => ({ width: favorite.getMetric("width"), height: favorite.getMetric("height") }));
}

function isDimensionsList(stored: unknown): stored is readonly Size[] {
  return Array.isArray(stored) && stored.every(hasFields<Size>({ width: isNumber, height: isNumber }));
}
