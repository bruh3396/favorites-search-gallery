import { Preference, StoredPreference } from "@/core/utils/reactive/preference";
import { hasFields, isNumber } from "@/core/utils/guards/guards";
import { DEFAULT_SKELETON_DIMENSIONS } from "@/core/ui/post_grid/skeleton";
import { Dimensions } from "@/core/ui/post_grid/tile";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { createGuardedCodec } from "@/core/utils/codec/codec";

const SKELETON_NAMESPACE = "favoritesSkeleton";

export function createSkeletonDimensions(store: LocalKeyedValues, ownerId: string): Preference<readonly Dimensions[]> {
  return new StoredPreference(
    { key: ownerId, defaultValue: DEFAULT_SKELETON_DIMENSIONS },
    { store: new NamespacedLocalKeyedValues(SKELETON_NAMESPACE, store), codec: createGuardedCodec(isDimensionsList) }
  );
}

function isDimensionsList(stored: unknown): stored is readonly Dimensions[] {
  return Array.isArray(stored) && stored.every(hasFields<Dimensions>({ width: isNumber, height: isNumber }));
}
