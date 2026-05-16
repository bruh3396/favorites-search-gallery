import * as FavoritesApi from "../../../lib/remote/rule34/favorites_fetcher";
import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesResultsFlow from "./results_flow";
import * as FavoritesSearchFlow from "./search_flow";
import * as FavoritesView from "../view/favorites_view";
import { Events } from "../../../lib/communication/events";

export async function loadAllFavorites(): Promise<void> {
  if (await hasDatabaseFavorites()) {
    await loadDatabaseFavorites();
    await fetchNewFavorites();
  } else {
    await fetchAllFavorites();
  }
  Events.favorites.favoritesLoaded.emit();
}

async function hasDatabaseFavorites(): Promise<boolean> {
  const hasDbFavorites = await FavoritesModel.hasDatabaseFavorites();

  Events.favorites.favoritesFoundInDatabase.emit(hasDbFavorites);
  return hasDbFavorites;
}

async function loadDatabaseFavorites(): Promise<void> {
  FavoritesView.setStatus("Loading favorites");
  await FavoritesModel.loadDatabaseFavorites();
  FavoritesView.setTemporaryStatus("Favorites loaded");
  FavoritesSearchFlow.searchFavorites();
}

async function fetchNewFavorites(): Promise<void> {
  FavoritesView.setStatus("Finding new favorites");
  const results = await FavoritesModel.fetchNewFavorites();

  if (results.newSearchResults.length === 0) {
    FavoritesView.setTemporaryStatus("No new favorites found");
    return;
  }
  await FavoritesModel.storeFavorites(results.newFavorites);
  FavoritesView.addToTop(results.newSearchResults);
  FavoritesView.notifyNewFavoritesFound(results);
  FavoritesView.setTemporaryStatus(`Saved ${results.newFavorites.length} new favorites`);
  FavoritesModel.repaginateCurrentResults();
  Events.favorites.newFavoritesFound.emit(results.newSearchResults);
  Events.favorites.searchResultsUpdated.emit();
}

async function fetchAllFavorites(): Promise<void> {
  FavoritesApi.fetchFavoritesCount().then(FavoritesView.setExpectedTotalFavoritesCount);
  FavoritesResultsFlow.clearResults();
  await FavoritesModel.fetchAllFavorites(FavoritesResultsFlow.syncResults);
  FavoritesView.setStatus("Saving favorites");
  await FavoritesModel.storeFavorites(FavoritesModel.getAllFavorites());
  FavoritesView.setTemporaryStatus("All favorites saved");
}
