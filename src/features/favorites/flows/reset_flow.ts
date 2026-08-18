import * as ExtensionResolver from "@/lib/media/extension_resolver";
import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import { Events } from "@/app/channels/events";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { Storage } from "@/lib/storage/local_storage";
import { queueMacroTask } from "@/lib/async/scheduling";
import { reloadWindow } from "@/utils/platform/browser";

const DESKTOP_RESET_PROMPT_SUFFIX = "\nTag edits and search snippets will be preserved.";
const RESET_PROMPT = `Are you sure you want to reset?\nThis will clear all cached favorites and preferences.${ON_MOBILE_DEVICE ? "" : DESKTOP_RESET_PROMPT_SUFFIX}`;
const persistentLocalStorageKeys: ReadonlySet<string> = new Set(["customTags", "savedSearches", "searchSnippets"]);

export async function reset(): Promise<void> {
  if (confirm(RESET_PROMPT)) {
    Storage.clear(persistentLocalStorageKeys);
    Events.favorites.resetConfirmed.emit();
    await FavoritesModel.destroyStore();
    await ExtensionResolver.destroyStore();
    queueMacroTask(reloadWindow);
  }
}
