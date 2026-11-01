import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { StoredValueStorage } from "@/core/utils/storage/stored_value_storage";

const APP_STORAGE_KEY = "favorites-search-gallery";

export interface AppStorage {
  readonly preferences: StoredValueStorage;
  readonly state: StoredValueStorage;
}

export function createAppStorage(localKeyedValues: LocalKeyedValues): AppStorage {
  const namespacedLocalKeyedValues = new NamespacedLocalKeyedValues({ namespace: APP_STORAGE_KEY, uncached: true }, localKeyedValues);
  return {
    preferences: new NamespacedLocalKeyedValues({ namespace: "preferences" }, namespacedLocalKeyedValues),
    state: new NamespacedLocalKeyedValues({ namespace: "state" }, namespacedLocalKeyedValues)
  };
}
