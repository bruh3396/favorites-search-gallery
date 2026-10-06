import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { PreferenceStore } from "@/core/utils/reactive/preference";

const APP_NAMESPACE = "favorites-search-gallery";
const PREFERENCES_NAMESPACE = "preferences";

export interface AppStores {
  app: LocalKeyedValues;
  preferences: PreferenceStore;
}

export function createAppStores(localKeyedValues: LocalKeyedValues): AppStores {
  const app = new NamespacedLocalKeyedValues(APP_NAMESPACE, localKeyedValues);
  return { app, preferences: new NamespacedLocalKeyedValues(PREFERENCES_NAMESPACE, app) };
}
