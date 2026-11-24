import { StoredValueStorage } from "@/core/utils/storage/stored_value_storage";
import { isRecord } from "@/core/utils/guard/unknown_utilities";

export function createBranchStoredValueStorage(name: string, parentStoredValueStorage: StoredValueStorage): StoredValueStorage {
  const read = (): Record<string, unknown> => {
    const stored = parentStoredValueStorage.get(name);
    return isRecord(stored) ? stored : {};
  };
  return {
    get: key => read()[key],
    set: (key, value): void => parentStoredValueStorage.set(name, { ...read(), [key]: value })
  };
}
