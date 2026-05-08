import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesPresentationFlow from "./presentation_flow";
import * as FavoritesSearchFlow from "./search_flow";
import * as FavoritesView from "../view/favorites_view";
import * as PostAPI from "../../../lib/remote/api/post_fetcher";
import { Events } from "../../../lib/communication/events";
import { NewFavorites } from "../types/favorite_types";
import { fetchFavoritesCount } from "../../../lib/remote/rule34/favorites_fetcher";

export async function loadAllFavorites(): Promise<void> {
  if (await loadDatabaseFavorites()) {
    showLoadedFavorites();
    showNewFavorites(await loadNewFavorites());
  } else {
    await fetchAllFavorites();
  }
  finishLoading();
}

async function loadDatabaseFavorites(): Promise<boolean> {
  FavoritesView.setStatus("Loading favorites");
  await FavoritesModel.loadDatabaseFavorites();
  return FavoritesModel.hasFavorites();
}

function showLoadedFavorites(): void {
  FavoritesModel.onDatabaseWritten();
  FavoritesView.setTemporaryStatus("Favorites loaded");
  FavoritesSearchFlow.searchFavorites();
  Events.favorites.favoritesFoundInDatabase.emit(true);
}

async function loadNewFavorites(): Promise<NewFavorites | null> {
  FavoritesView.setStatus("Finding new favorites");
  const results = await FavoritesModel.fetchNewFavorites();

  if (results.newSearchResults.length === 0) {
    FavoritesView.setTemporaryStatus("No new favorites found");
    return null;
  }
  FavoritesView.insertNewSearchResultsOnReload(results);
  FavoritesView.notifyNewFavoritesFound(results);
  await FavoritesModel.storeNewFavorites(results.newFavorites);
  return results;
}

function showNewFavorites(results: NewFavorites | null): void {
  if (results === null) {
    return;
  }
  FavoritesView.setTemporaryStatus(`Saved ${results.newFavorites.length} new favorites`);
  FavoritesView.setFavorites(FavoritesModel.getLatestSearchResults());
  Events.favorites.newFavoritesFound.emit(results.newSearchResults);
  Events.favorites.searchResultsUpdated.emit();
}

async function fetchAllFavorites(): Promise<void> {
  Events.favorites.favoritesFoundInDatabase.emit(false);
  PostAPI.setPostPageGate(Events.favorites.favoritesLoaded.wait());
  fetchFavoritesCount().then(FavoritesView.setExpectedTotalFavoritesCount);
  FavoritesPresentationFlow.presentNothing();
  Events.favorites.startedFetchingFavorites.emit();
  await FavoritesModel.fetchAllFavorites(handleFetchedFavoritesPage);
  FavoritesView.setStatus("Saving favorites");
  await FavoritesModel.storeAllFavorites();
  FavoritesView.setTemporaryStatus("All favorites saved");
  FavoritesModel.onDatabaseWritten();
}

function handleFetchedFavoritesPage(): void {
  FavoritesView.updateStatusWhileFetching(
    FavoritesModel.getLatestSearchResults().length,
    FavoritesModel.getAllFavorites().length
  );
  Events.favorites.searchResultsUpdated.emit();
  FavoritesPresentationFlow.handleNewSearchResults();
}

function finishLoading(): void {
  FavoritesView.collectAspectRatios();
  Events.favorites.favoritesLoaded.emit();
}
