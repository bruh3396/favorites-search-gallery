import { Device } from "@/core/boundary/environment";
import { FavoritesFlow } from "@/features/favorites/flows/flow";
import { reloadWindow } from "@/utils/browser/window";

const RESET_PROMPT_SUFFIX: Record<Device, string> = {
  desktop: "\nTag edits and search snippets will be preserved.",
  mobile: ""
};
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
    const suffix = RESET_PROMPT_SUFFIX[this.context.environment.device];
    return `Are you sure you want to reset?\nThis will clear all cached favorites and preferences.${suffix}`;
  }
}
