import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { StoredValueStorage } from "@/core/utils/stored_value/stored_value_storage";

const APP_STORAGE_KEY = "favorites-search-gallery";

export interface AppStorage {
  readonly preferences: StoredValueStorage;
  readonly state: StoredValueStorage;
}

export function createAppStorage(localKeyedValues: LocalKeyedValues): AppStorage {
  return {
    preferences: new NamespacedLocalKeyedValues(`${APP_STORAGE_KEY}:preferences`, localKeyedValues),
    state: new NamespacedLocalKeyedValues(`${APP_STORAGE_KEY}:state`, localKeyedValues)
  };
}
