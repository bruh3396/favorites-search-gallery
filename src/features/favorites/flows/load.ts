import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesFlow } from "@/features/favorites/flows/flow";
import { Post } from "@/types/api";
import { fetchFavoritesCount } from "@/lib/remote/fetchers/html";
import { pluralSuffix } from "@/utils/pure/string";
import { sleep } from "@/lib/async/scheduling";

export class FavoritesLoadFlow extends FavoritesFlow {
  public async loadAllFavorites(firstPageFavorites: Post[] | undefined): Promise<void> {
    const storedFavoritesCount = await this.model.countStoredFavorites();
    const hasStoredFavorites = storedFavoritesCount > 0;

    this.context.events.favorites.storedFavoritesFound.emit(hasStoredFavorites);

    if (hasStoredFavorites) {
      await this.loadStoredFavorites(storedFavoritesCount);
      await this.fetchNewFavorites(firstPageFavorites);
      await this.indexAllFavorites();
      this.flows.search.searchFavorites("");
    } else {
      await this.fetchAllFavorites(firstPageFavorites);
    }
    this.model.compressFavorites();
    this.context.events.favorites.favoritesLoaded.emit();
  }

  private async loadStoredFavorites(storedFavoritesCount: number): Promise<void> {
    if (storedFavoritesCount > FavoritesConfig.streamStoredFavoritesThreshold) {
      await this.streamStoredFavorites();
    } else {
      this.view.setStatus("Loading favorites");
      await this.model.loadStoredFavorites();
    }
    this.context.events.favorites.storedFavoritesLoaded.emit();
    this.view.setTemporaryStatus("Favorites loaded");
    this.view.clearStatus();
  }

  private async streamStoredFavorites(): Promise<void> {
    const totalFavoritesCount = await this.model.countStoredFavorites();

    this.view.setLoadProgress(0, totalFavoritesCount);
    await this.model.streamStoredFavorites(loaded => this.view.setLoadProgress(loaded, totalFavoritesCount));
  }

  private async fetchNewFavorites(firstPageFavorites: Post[] | undefined): Promise<void> {
    this.view.setStatus("Fetching new favorites");
    const newFavorites = await this.model.fetchNewFavorites(firstPageFavorites);

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

  private async fetchAllFavorites(firstPageFavorites: Post[] | undefined): Promise<void> {
    fetchFavoritesCount(this.context.environment.favoritesPageId).then((count) => this.view.setExpectedTotalFavoritesCount(count));
    this.flows.display.clear();
    await this.model.fetchAllFavorites(favorites => this.flows.display.sync(favorites), firstPageFavorites);
    this.view.setStatus("Saving favorites");
    await this.model.storeFavorites(this.model.getAllFavorites());
    this.view.setTemporaryStatus("All favorites saved");
  }
}
