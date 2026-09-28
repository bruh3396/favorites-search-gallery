import { FavoritesFlow } from "@/features/favorites/flows/flow";
import { Preference } from "@/lib/storage/preference";
import { Storage } from "@/lib/storage/local_storage";
import { reloadWindow } from "@/utils/browser/window";

const DESKTOP_RESET_PROMPT_SUFFIX = "\nTag edits and search snippets will be preserved.";
const PERSISTENT_LOCAL_STORAGE_KEYS: ReadonlySet<string> = new Set(["customTags", "savedSearches", "searchSnippets"]);

export class FavoritesActionFlow extends FavoritesFlow {
  public removeFavorite(id: string): void {
    this.model.deleteStoredFavorite(id);
    this.view.setFavorited(id, false);
  }

  public reset(): void {
    if (confirm(this.resetPrompt())) {
      Storage.clear(PERSISTENT_LOCAL_STORAGE_KEYS);
      this.model.destroyStore();
    }
  }

  public resetSettings(): void {
    if (confirm("Reset all settings?")) {
      Preference.resetAll();
      reloadWindow();
    }
  }

  private resetPrompt(): string {
    const suffix = this.context.environment.device === "mobile" ? "" : DESKTOP_RESET_PROMPT_SUFFIX;
    return `Are you sure you want to reset?\nThis will clear all cached favorites and preferences.${suffix}`;
  }
}
