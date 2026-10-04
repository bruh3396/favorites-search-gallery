import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";

const NAMESPACE = "fsg";
// Keys the app kept bare in the store before everything moved under NAMESPACE.
const UNNAMESPACED_KEYS = ["preferences", "searchHistory", "lastEditedSearchQuery", "aspectRatios", "searchSnippets"];

export function createLocalKeyedValues(store: LocalKeyedValues): LocalKeyedValues {
  const namespacedLocalKeyedValues = new NamespacedLocalKeyedValues(NAMESPACE, store);

  namespacedLocalKeyedValues.moveIn(UNNAMESPACED_KEYS);
  return namespacedLocalKeyedValues;
}
