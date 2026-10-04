import { FavoritesFlow } from "@/features/favorites/flows/flow";

export class FavoritesLoadFlow extends FavoritesFlow {
  public async loadAllFavorites(): Promise<void> {
    const hasLocalFavorites = await this.model.hasLocalFavorites();

    this.context.milestones.favorites.localFavoritesFound.reach(hasLocalFavorites);

    try {
      await (hasLocalFavorites ? this.flows.reload.reloadFavorites() : this.flows.fetch.fetchAllFavorites());
    } catch {
      this.view.setTemporaryStatus("Rule34 stopped sending favorites, try again later");
    }
    this.model.compressFavorites();
    this.context.milestones.favorites.favoritesLoaded.reach();
  }
}
