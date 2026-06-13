import { FeatureBridge } from "@/app/channels/feature_bridge";
import { Storage } from "@/lib/storage/local_storage";

export function startSavedSearches(): void {
  FeatureBridge.savedSearches.register(getSavedSearches);
}

function getSavedSearches(): string[] {
  return Storage.get<string[]>("savedSearches") ?? [];
}
