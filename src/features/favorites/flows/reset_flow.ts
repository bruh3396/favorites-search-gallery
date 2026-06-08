import * as ExtensionResolver from "@/lib/media/media_extension_resolver";
import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import { Events } from "@/app/channels/events";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { Storage } from "@/lib/storage/local_storage";

const DESKTOP_RESET_PROMPT_SUFFIX = "\nTag edits and saved searches will be preserved.";
const RESET_PROMPT = `Are you sure you want to reset?\nThis will clear all cached favorites and preferences.${ON_MOBILE_DEVICE ? "" : DESKTOP_RESET_PROMPT_SUFFIX}`;
const persistentLocalStorageKeys = new Set(["customTags", "savedSearches"]);

export function attemptReset(): void {
  if (confirm(RESET_PROMPT)) {
    Storage.clear(persistentLocalStorageKeys);
    Events.favorites.resetConfirmed.emit();
    FavoritesModel.destroyStore();
    ExtensionResolver.destroyStore();
  }
}
