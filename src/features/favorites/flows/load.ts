import * as FavoritesFlows from "@/features/favorites/flows/flows";
import * as FavoritesModel from "@/features/favorites/model/model";
import * as FavoritesView from "@/features/favorites/view/view";
import { Events } from "@/app/channels/events";
import { fetchFavoritesCount } from "@/lib/remote/pages";

export async function loadAllFavorites(firstPageFavorites: HTMLElement[] | undefined): Promise<void> {
  await FavoritesModel.migrateLegacyStores(() => FavoritesView.setStatus("Migrating favorites"));

  if (await hasStoredFavorites()) {
    await loadStoredFavorites();
    await fetchNewFavorites(firstPageFavorites);
  } else {
    await fetchAllFavorites(firstPageFavorites);
  }
  Events.favorites.favoritesLoaded.emit();
}

async function hasStoredFavorites(): Promise<boolean> {
  const hasFavorites = await FavoritesModel.hasStoredFavorites();

  Events.favorites.storedFavoritesFound.emit(hasFavorites);
  return hasFavorites;
}

async function loadStoredFavorites(): Promise<void> {
  FavoritesView.setStatus("Loading favorites");
  await FavoritesModel.loadStoredFavorites();
  Events.favorites.storedFavoritesLoaded.emit();
  FavoritesView.setTemporaryStatus("Favorites loaded");
  FavoritesFlows.Search.reSearchFavorites();
}

async function fetchNewFavorites(firstPageFavorites: HTMLElement[] | undefined): Promise<void> {
  FavoritesView.setStatus("Finding new favorites");
  const results = await FavoritesModel.fetchNewFavorites(firstPageFavorites);

  if (results.searchResults.length === 0) {
    FavoritesView.setTemporaryStatus("No new favorites found");
    return;
  }
  await FavoritesModel.storeFavorites(results.favorites);
  FavoritesView.markAsNew(results.favorites);
  FavoritesView.addToTop(results.searchResults);
  FavoritesView.notifyNewFavoritesFound(results);
  FavoritesView.setTemporaryStatus(`Saved ${results.favorites.length} new favorites`);
  FavoritesModel.repaginateCurrentResults();
}

async function fetchAllFavorites(firstPageFavorites: HTMLElement[] | undefined): Promise<void> {
  fetchFavoritesCount().then(FavoritesView.setExpectedTotalFavoritesCount);
  FavoritesFlows.Display.clear();
  await FavoritesModel.fetchAllFavorites(FavoritesFlows.Display.sync, firstPageFavorites);
  FavoritesView.setStatus("Saving favorites");
  await FavoritesModel.storeFavorites(FavoritesModel.getAllFavorites());
  FavoritesView.setTemporaryStatus("All favorites saved");
}
