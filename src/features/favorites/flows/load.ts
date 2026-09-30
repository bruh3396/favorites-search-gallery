import { FavoritesFlow } from "@/features/favorites/flows/flow";
import { pluralSuffix } from "@/utils/pure/string";
import { sleep } from "@/lib/async/scheduling";

export class FavoritesLoadFlow extends FavoritesFlow {
  public async loadAllFavorites(): Promise<void> {
    const storedFavoriteCount = await this.model.countStoredFavorites();
    const hasStoredFavorites = storedFavoriteCount > 0;

    this.context.events.favorites.storedFavoritesFound.emit(hasStoredFavorites);

    if (hasStoredFavorites) {
      await this.loadStoredFavorites(storedFavoriteCount);
      await this.fetchNewFavorites();
      await this.indexAllFavorites();
      this.flows.search.searchFavorites("");
    } else {
      await this.fetchAllFavorites();
    }
    this.model.compressFavorites();
    this.context.events.favorites.favoritesLoaded.emit();
  }

  private async loadStoredFavorites(storedFavoriteCount: number): Promise<void> {
    let loadedCount = 0;

    this.view.setLoadProgress(0, storedFavoriteCount);
    await this.model.streamStoredFavorites(posts => {
      loadedCount += posts.length;
      this.view.setLoadProgress(loadedCount, storedFavoriteCount);
    });
    this.context.events.favorites.storedFavoritesLoaded.emit();
    this.view.setTemporaryStatus("Favorites loaded");
    this.view.clearStatus();
  }

  private async fetchNewFavorites(): Promise<void> {
    this.view.setStatus("Fetching new favorites");
    const newFavorites = await this.model.fetchNewFavorites();

    if (newFavorites.length === 0) {
      this.view.clearStatus();
      return;
    }
    await this.model.storeFavorites(newFavorites);
    newFavorites.forEach((favorite) => favorite.markAsNew());
    this.view.setTemporaryStatus(`Saved ${newFavorites.length} new favorite${pluralSuffix(newFavorites.length)}`);
    this.model.repaginateCurrentResults();
  }

  private async indexAllFavorites(): Promise<void> {
    this.view.setStatus("Indexing");
    await sleep(10);
    this.model.indexAllFavorites();
    this.view.clearStatus();
  }

  private async fetchAllFavorites(): Promise<void> {
    this.model.fetchFavoriteCount().then((count) => this.view.setExpectedTotalFavoriteCount(count));
    this.flows.display.clear();
    await this.model.fetchAllFavorites(favorites => this.flows.display.sync(favorites));
    this.view.setStatus("Saving favorites");
    await this.model.storeFavorites(this.model.getAllFavorites());
    this.view.setTemporaryStatus("All favorites saved");
  }
}
