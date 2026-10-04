import { FavoritesFlow } from "@/features/favorites/flows/flow";
import { reloadWindow } from "@/utils/browser/window";

export class FavoritesActionFlow extends FavoritesFlow {
  public removeFavorite(id: string): void {
    this.model.deleteLocalFavorites([id]);
    this.view.setFavorited(id, false);
  }

  public resetSettings(): void {
    if (confirm("Reset all settings?")) {
      this.context.preferences.reset();
      reloadWindow();
    }
  }
}
