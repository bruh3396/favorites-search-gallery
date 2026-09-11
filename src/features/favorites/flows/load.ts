import * as FavoritesFlows from "@/features/favorites/flows/flows";
import * as FavoritesModel from "@/features/favorites/model/model";
import * as FavoritesView from "@/features/favorites/view/view";
import { Events } from "@/app/channels/events";
import { FavoritesConfig } from "@/config/favorites_config";
import { fetchFavoritesCount } from "@/lib/remote/fetchers/html";
import { pluralSuffix } from "@/utils/pure/string";
import { sleep } from "@/lib/async/scheduling";

export async function loadAllFavorites(firstPageFavorites: HTMLElement[] | undefined): Promise<void> {
  const storedFavoritesCount = await FavoritesModel.countStoredFavorites();
  const hasStoredFavorites = storedFavoritesCount > 0;

  Events.favorites.storedFavoritesFound.emit(hasStoredFavorites);

  if (hasStoredFavorites) {
    await loadStoredFavorites(storedFavoritesCount);
    await fetchNewFavorites(firstPageFavorites);
    await indexLoadedFavorites();
    FavoritesFlows.Search.reSearchFavorites();
  } else {
    FavoritesView.toggleToolbar(true);
    await fetchAllFavorites(firstPageFavorites);
  }
  FavoritesView.toggleToolbar(true);
  Events.favorites.favoritesLoaded.emit();
}

async function loadStoredFavorites(storedFavoritesCount: number): Promise<void> {
  if (storedFavoritesCount > FavoritesConfig.streamStoredFavoritesThreshold) {
    await streamStoredFavorites();
  } else {
    FavoritesView.setStatus("Loading favorites");
    await FavoritesModel.loadStoredFavorites();
  }
  Events.favorites.storedFavoritesLoaded.emit();
  FavoritesView.setTemporaryStatus("Favorites loaded");
  FavoritesView.clearStatus();
}

async function streamStoredFavorites(): Promise<void> {
  const totalFavoritesCount = await FavoritesModel.countStoredFavorites();

  FavoritesView.setLoadProgress(0, totalFavoritesCount);
  await FavoritesModel.streamStoredFavorites(loaded => FavoritesView.setLoadProgress(loaded, totalFavoritesCount));
}

async function fetchNewFavorites(firstPageFavorites: HTMLElement[] | undefined): Promise<void> {
  FavoritesView.setStatus("Fetching new favorites");
  const newFavorites = await FavoritesModel.fetchNewFavorites(firstPageFavorites);

  if (newFavorites.length === 0) {
    FavoritesView.clearStatus();
    return;
  }
  await FavoritesModel.storeFavorites(newFavorites);
  FavoritesView.markAsNew(newFavorites);
  FavoritesView.setTemporaryStatus(`Saved ${newFavorites.length} new favorite${pluralSuffix(newFavorites.length)}`);
  FavoritesModel.repaginateCurrentResults();
}

async function indexLoadedFavorites(): Promise<void> {
  FavoritesView.setStatus("Indexing");
  await sleep(10);
  FavoritesModel.indexAllFavorites();
  FavoritesView.clearStatus();
}

async function fetchAllFavorites(firstPageFavorites: HTMLElement[] | undefined): Promise<void> {
  fetchFavoritesCount().then(FavoritesView.setExpectedTotalFavoritesCount);
  FavoritesFlows.Display.clear();
  await FavoritesModel.fetchAllFavorites(FavoritesFlows.Display.sync, firstPageFavorites);
  FavoritesView.setStatus("Saving favorites");
  await FavoritesModel.storeFavorites(FavoritesModel.getAllFavorites());
  FavoritesView.setTemporaryStatus("All favorites saved");
}
