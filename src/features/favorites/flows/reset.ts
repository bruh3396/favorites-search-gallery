import { FavoritesFlow } from "@/features/favorites/flows/flow";
import { Storage } from "@/lib/storage/local_storage";

const DESKTOP_RESET_PROMPT_SUFFIX = "\nTag edits and search snippets will be preserved.";
const PERSISTENT_LOCAL_STORAGE_KEYS: ReadonlySet<string> = new Set(["customTags", "savedSearches", "searchSnippets"]);

export class FavoritesResetFlow extends FavoritesFlow {

  public reset(): void {
    if (confirm(this.resetPrompt())) {
      Storage.clear(PERSISTENT_LOCAL_STORAGE_KEYS);
      this.model.destroyStore();
    }
  }

  private resetPrompt(): string {
    const suffix = this.context.environment.onMobileDevice ? "" : DESKTOP_RESET_PROMPT_SUFFIX;
    return `Are you sure you want to reset?\nThis will clear all cached favorites and preferences.${suffix}`;
  }
}
