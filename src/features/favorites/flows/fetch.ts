import { FavoritesFlow } from "@/features/favorites/flows/flow";

export class FavoritesFetchFlow extends FavoritesFlow {
  public async fetchAllFavorites(): Promise<void> {
    this.model.fetchFavoriteCount().then(count => this.view.setExpectedTotalFavoriteCount(count));
    this.flows.display.clear();
    await this.model.fetchAllFavorites(favorites => this.flows.display.sync(favorites));
    await this.persistAllFavorites();
  }

  private async persistAllFavorites(): Promise<void> {
    this.view.setStatus("Saving favorites");
    await this.model.persistAllFavorites();
    this.view.setTemporaryStatus("All favorites saved");
  }
}
