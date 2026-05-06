import * as FavoritesDownloadController from "../features/downloader/downloader_menu";
import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesPresentationFlow from "./presentation_flow";
import * as FavoritesSearchFlow from "./search_flow";
import * as FavoritesView from "../view/favorites_view";
import * as PostAPI from "../../../lib/remote/api/post_fetcher";
import { Events } from "../../../lib/communication/events";
import { Favorite } from "../../../types/favorite";
import { fetchFavoritesCount } from "../../../lib/remote/rule34/favorites_fetcher";

export async function loadAllFavorites(): Promise<void> {
  await loadDatabaseFavorites();
  Events.favorites.favoritesFoundInDatabase.emit(FavoritesModel.hasFavorites());

  if (FavoritesModel.hasFavorites()) {
    await handleExistingFavorites();
  } else {
    await fetchFavorites();
  }
  finishLoading();
}

function loadDatabaseFavorites(): Promise<void> {
  FavoritesView.setStatus("Loading favorites");
  return FavoritesModel.loadDatabaseFavorites();
}

function handleExistingFavorites(): Promise<void> {
  FavoritesModel.onDatabaseWritten();
  showLoadedFavorites();
  return loadNewFavorites();
}

function showLoadedFavorites(): void {
  FavoritesView.setTemporaryStatus("Favorites loaded");
  FavoritesSearchFlow.searchFavorites();
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

function fetchFavorites(): Promise<void> {
  PostAPI.setPostPageGate(Events.favorites.favoritesLoaded.wait());
  fetchFavoritesCount().then(FavoritesView.setExpectedTotalFavoritesCount);
  return fetchAllFavorites().then(saveAllFavorites);
}

async function fetchAllFavorites(): Promise<void> {
  FavoritesPresentationFlow.presentNothing();
  Events.favorites.startedFetchingFavorites.emit();
  await FavoritesModel.fetchAllFavorites(handleFetchedFavoritesPage);
}

function handleFetchedFavoritesPage(): void {
  FavoritesView.updateStatusWhileFetching(
    FavoritesModel.getLatestSearchResults().length,
    FavoritesModel.getAllFavorites().length
  );
  Events.favorites.searchResultsUpdated.emit();
  FavoritesPresentationFlow.handleNewSearchResults();
}

async function saveAllFavorites(): Promise<void> {
  FavoritesView.setStatus("Saving favorites");
  await FavoritesModel.storeAllFavorites();
  FavoritesView.setTemporaryStatus("All favorites saved");
  FavoritesModel.onDatabaseWritten();
}

function finishLoading(): void {
  FavoritesView.collectAspectRatios();
  FavoritesDownloadController.enableDownloadMenu();
  Events.favorites.favoritesLoaded.emit();
}
