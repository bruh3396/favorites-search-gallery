import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";

const NAMESPACE = "favorites-search-gallery";
const LOOSE_KEYS = ["preferences", "searchHistory", "lastEditedSearchQuery", "aspectRatios", "searchSnippets"];

export function createLocalKeyedValues(store: LocalKeyedValues): NamespacedLocalKeyedValues {
  const namespacedLocalKeyedValues = new NamespacedLocalKeyedValues(NAMESPACE, store);

  namespacedLocalKeyedValues.moveIn(LOOSE_KEYS);
  return namespacedLocalKeyedValues;
}
