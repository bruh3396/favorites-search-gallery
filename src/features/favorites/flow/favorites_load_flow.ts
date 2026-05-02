import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesPresentationFlow from "./favorites_presentation_flow";
import * as FavoritesSearchFlow from "./favorites_search_flow";
import * as FavoritesView from "../view/favorites_view";
import { Events } from "../../../lib/communication/events";
import { Favorite } from "../../../types/favorite";

export async function loadAllFavorites(): Promise<void> {
  await loadDatabaseFavorites();

  if (FavoritesModel.hasFavorites()) {
    await handleExistingFavorites();
  } else {
    await fetchFavorites();
  }
  FavoritesView.collectAspectRatios();
  Events.favorites.favoritesLoaded.emit();
}

function loadDatabaseFavorites(): Promise<void> {
  FavoritesView.setStatus("Loading favorites");
  return FavoritesModel.loadDatabaseFavorites();
}

function handleExistingFavorites(): Promise<void> {
  FavoritesModel.onDatabaseWritten();
  Events.favorites.favoritesLoadedFromDatabase.emit();
  showLoadedFavorites();
  return loadNewFavorites();
}

function fetchFavorites(): Promise<void> {
  return fetchAllFavorites().then(saveAllFavorites);
}

async function fetchAllFavorites(): Promise<void> {
  FavoritesPresentationFlow.clear();
  Events.favorites.startedFetchingFavorites.emit();
  await FavoritesModel.fetchAllFavorites(handleFetchedFavoritesPage);
}

async function saveAllFavorites(): Promise<void> {
  FavoritesView.setStatus("Saving favorites");
  await FavoritesModel.storeAllFavorites();
  FavoritesView.setTemporaryStatus("All favorites saved");
  FavoritesModel.onDatabaseWritten();
}

function showLoadedFavorites(): void {
  FavoritesView.setTemporaryStatus("Favorites loaded");
  FavoritesSearchFlow.searchFavorites();
}

function handleFetchedFavoritesPage(): void {
  FavoritesView.updateStatusWhileFetching(
    FavoritesModel.getLatestSearchResults().length,
    FavoritesModel.getAllFavorites().length
  );
  Events.favorites.searchResultsUpdated.emit();
  FavoritesPresentationFlow.handleNewSearchResults();
}

async function loadNewFavorites(): Promise<void> {
  FavoritesView.setStatus("Finding new favorites");
  const results = await FavoritesModel.fetchNewFavorites();

  if (results.newSearchResults.length === 0) {
    FavoritesView.setTemporaryStatus("No new favorites found");
    return;
  }
  FavoritesView.insertNewSearchResultsOnReload(results);
  FavoritesView.notifyNewFavoritesFound(results);
  saveNewFavorites(results.newFavorites);
  FavoritesView.setFavorites(FavoritesModel.getLatestSearchResults());
  Events.favorites.newFavoritesFound.emit(results.newSearchResults);
  Events.favorites.searchResultsUpdated.emit();
}

async function saveNewFavorites(newFavorites: Favorite[]): Promise<void> {
  await FavoritesModel.storeNewFavorites(newFavorites);
  FavoritesView.setTemporaryStatus(`Saved ${newFavorites.length} new favorites`);
}
