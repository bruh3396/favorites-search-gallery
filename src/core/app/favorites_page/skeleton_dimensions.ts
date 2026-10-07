import { Preference, StoredPreference } from "@/core/utils/reactive/preference";
import { hasFields, isNumber } from "@/core/utils/guards/guards";
import { DEFAULT_SKELETON_DIMENSIONS } from "@/core/ui/post_grid/skeleton";
import { Dimensions } from "@/core/domain/post/post";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { createGuardedCodec } from "@/core/utils/codec/codec";

const SKELETON_NAMESPACE = "favoritesSkeleton";
const MEASURED_COUNT = 50;

export function createSkeletonDimensions(storage: LocalKeyedValues, ownerId: string): Preference<readonly Dimensions[]> {
  return new StoredPreference(
    { key: ownerId, defaultValue: DEFAULT_SKELETON_DIMENSIONS },
    { storage: new NamespacedLocalKeyedValues(SKELETON_NAMESPACE, storage), codec: createGuardedCodec(isDimensionsList) }
  );
}

export function measureSkeletonDimensions(favorites: readonly Favorite[]): Dimensions[] {
  return favorites
    .slice(0, MEASURED_COUNT)
    .map(favorite => ({ width: favorite.getMetric("width"), height: favorite.getMetric("height") }))
    .filter(({ width, height }) => width > 0 && height > 0);
}

function isDimensionsList(stored: unknown): stored is readonly Dimensions[] {
  return Array.isArray(stored) && stored.every(hasFields<Dimensions>({ width: isNumber, height: isNumber }));
}
