import { FavoritesFlow } from "@/features/favorites/flows/flow";
import { pluralSuffix } from "@/utils/pure/string";
import { reloadWindow } from "@/utils/browser/window";

const FETCH_FAILED_STATUS = "Rule34 stopped sending favorites, try again later";

export class FavoritesActionFlow extends FavoritesFlow {
  private isReconciling = false;

  public removeFavorite(id: string): void {
    this.model.deleteStoredFavorites([id]);
    this.view.setFavorited(id, false);
  }

  public async reconcile(): Promise<void> {
    if (!this.context.milestones.favorites.favoritesLoaded.reached) {
      this.view.setTemporaryStatus("Wait for favorites to finish loading");
      return;
    }

    if (this.isReconciling) {
      return;
    }
    this.isReconciling = true;
    this.view.setStatus("Checking for unfavorited posts");
    const unfavoritedIds = await this.model.findUnfavoritedIds().catch(() => undefined);

    this.isReconciling = false;
    await this.applyUnfavoritedIds(unfavoritedIds);
  }

  public resetSettings(): void {
    if (confirm("Reset all settings?")) {
      this.context.preferences.reset();
      reloadWindow();
    }
  }

  private async applyUnfavoritedIds(unfavoritedIds: string[] | null | undefined): Promise<void> {
    if (unfavoritedIds === undefined) {
      this.view.setStatus(FETCH_FAILED_STATUS);
      return;
    }

    if (unfavoritedIds === null) {
      this.view.setTemporaryStatus("Favorites changed during the check, try again");
      return;
    }

    if (unfavoritedIds.length === 0) {
      this.view.setTemporaryStatus("Favorites are up to date");
      return;
    }
    await this.model.deleteStoredFavorites(unfavoritedIds);
    this.view.setStatus(`Removed ${unfavoritedIds.length} unfavorited post${pluralSuffix(unfavoritedIds.length)}, reload to see the change`);
  }
}
