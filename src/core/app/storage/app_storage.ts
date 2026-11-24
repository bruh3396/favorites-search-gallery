import { StoredValueStorage } from "@/core/utils/storage/stored_value_storage";
import { createBranchStoredValueStorage } from "@/core/utils/storage/branch_stored_value_storage";

const APP_STORAGE_KEY = "favorites-search-gallery";

export interface AppStorage {
  readonly preferences: StoredValueStorage;
  readonly state: StoredValueStorage;
}

export function createAppStorage(storedValueStorage: StoredValueStorage): AppStorage {
  const branchStoredValueStorage = createBranchStoredValueStorage(APP_STORAGE_KEY, storedValueStorage);
  return {
    preferences: createBranchStoredValueStorage("preferences", branchStoredValueStorage),
    state: createBranchStoredValueStorage("state", branchStoredValueStorage)
  };
}
