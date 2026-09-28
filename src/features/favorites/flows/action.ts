import { FavoritesFlow } from "@/features/favorites/flows/flow";
import { reloadWindow } from "@/utils/browser/window";

const DESKTOP_RESET_PROMPT_SUFFIX = "\nTag edits and search snippets will be preserved.";
const RESET_STORAGE_KEYS = ["searchHistory", "lastEditedSearchQuery", "aspectRatios"];

export class FavoritesActionFlow extends FavoritesFlow {
  public removeFavorite(id: string): void {
    this.model.deleteStoredFavorite(id);
    this.view.setFavorited(id, false);
  }

  public reset(): void {
    if (confirm(this.resetPrompt())) {
      this.context.preferences.reset();
      RESET_STORAGE_KEYS.forEach(key => this.context.ports.keyValueStore.remove(key));
      this.model.destroyStore();
    }
  }

  public resetSettings(): void {
    if (confirm("Reset all settings?")) {
      this.context.preferences.reset();
      reloadWindow();
    }
  }

  private resetPrompt(): string {
    const suffix = this.context.environment.device === "mobile" ? "" : DESKTOP_RESET_PROMPT_SUFFIX;
    return `Are you sure you want to reset?\nThis will clear all cached favorites and preferences.${suffix}`;
  }
}
