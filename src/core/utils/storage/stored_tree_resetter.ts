import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { isRecord } from "@/core/utils/guard/unknown_utilities";

export function resetStoredTree(storedTree: object, keptStoredValues: readonly object[] = []): void {
  const nodes: unknown[] = Object.values(storedTree);

  nodes.forEach(node => {
    if (node instanceof KeyedStoredValue) {
      if (!keptStoredValues.includes(node)) {
        node.reset();
      }
    } else if (isRecord(node)) {
      resetStoredTree(node, keptStoredValues);
    }
  });
}
