import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { StoredValueStorage } from "@/core/utils/stored_value/stored_value_storage";

const APP_NAMESPACE = "favorites-search-gallery";
const PREFERENCES_NAMESPACE = "preferences";

export interface AppStorage {
  readonly app: LocalKeyedValues;
  readonly preferences: StoredValueStorage;
}

export function createAppStorage(localKeyedValues: LocalKeyedValues): AppStorage {
  const app = new NamespacedLocalKeyedValues(APP_NAMESPACE, localKeyedValues);
  return { app, preferences: new NamespacedLocalKeyedValues(PREFERENCES_NAMESPACE, app) };
}
