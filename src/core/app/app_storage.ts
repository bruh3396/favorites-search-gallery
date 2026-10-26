import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { PreferenceStorage } from "@/core/utils/preference/preference_storage";

const APP_NAMESPACE = "favorites-search-gallery";
const PREFERENCES_NAMESPACE = "preferences";

export interface AppStorage {
  readonly app: LocalKeyedValues;
  readonly appPreferences: PreferenceStorage;
  readonly favoritesPreferences: PreferenceStorage;
  readonly postListPreferences: PreferenceStorage;
  readonly lightboxPreferences: PreferenceStorage;
}

export function createAppStorage(localKeyedValues: LocalKeyedValues): AppStorage {
  const app = new NamespacedLocalKeyedValues(APP_NAMESPACE, localKeyedValues);
  const preferences = new NamespacedLocalKeyedValues(PREFERENCES_NAMESPACE, app);
  return {
    app,
    appPreferences: new NamespacedLocalKeyedValues("app", preferences),
    favoritesPreferences: new NamespacedLocalKeyedValues("favorites", preferences),
    postListPreferences: new NamespacedLocalKeyedValues("postList", preferences),
    lightboxPreferences: new NamespacedLocalKeyedValues("lightbox", preferences)
  };
}
