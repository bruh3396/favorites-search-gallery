import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesPresentationFlow from "../presentation/favorites_presentation_flow";
import * as FavoritesSearchFlow from "../runtime/favorites_search_flow";
import * as FavoritesView from "../../../view/favorites_view";
import { Events } from "../../../../../lib/events/events";
import { FavoriteItem } from "../../../types/favorite_item";

export async function loadAllFavorites(): Promise<void> {
  await loadAllFavoritesFromDatabase();

  if (FavoritesModel.hasFavorites()) {
    Events.favorites.favoritesLoadedFromDatabase.emit();
    showLoadedFavorites();
    await loadNewFavorites();
  } else {
    await fetchAllFavorites();
    Events.favorites.startedStoringAllFavorites.emit();
    await saveAllFavorites();
  }
  Events.favorites.favoritesLoaded.emit();
}

async function loadAllFavoritesFromDatabase(): Promise<void> {
  FavoritesView.setStatus("Loading favorites");
  await FavoritesModel.loadAllFavoritesFromDatabase();
}

async function fetchAllFavorites(): Promise<void> {
  FavoritesPresentationFlow.clear();
  Events.favorites.startedFetchingFavorites.emit();
  await FavoritesModel.fetchAllFavorites(processFetchedFavorites);
}

async function saveAllFavorites(): Promise<void> {
  Events.favorites.startedStoringAllFavorites.emit();
  FavoritesView.setStatus("Saving favorites");
  await FavoritesModel.storeAllFavorites();
  FavoritesView.setTemporaryStatus("All favorites saved");
}

function showLoadedFavorites(): void {
  FavoritesView.setTemporaryStatus("Favorites loaded");
  FavoritesSearchFlow.searchFavorites();
}

function processFetchedFavorites(): void {
  FavoritesView.updateStatusWhileFetching(FavoritesModel.getLatestSearchResults().length, FavoritesModel.getAllFavorites().length);
  Events.favorites.searchResultsUpdated.emit();
  FavoritesPresentationFlow.handleNewSearchResults();
}

async function loadNewFavorites(): Promise<void> {
  FavoritesView.setStatus("Finding new favorites");
  const results = await FavoritesModel.fetchNewFavoritesOnReload();

  if (results.newSearchResults.length === 0) {
    FavoritesView.setTemporaryStatus("No new favorites found");
    return;
  }
  FavoritesView.insertNewSearchResultsOnReload(results);
  FavoritesView.notifyNewFavoritesFound(results);
  saveNewFavorites(results.newFavorites);
  FavoritesView.paginate(FavoritesModel.getLatestSearchResults());
  Events.favorites.newFavoritesFoundOnReload.emit(results.newSearchResults);
  Events.favorites.searchResultsUpdated.emit();
}

async function saveNewFavorites(newFavorites: FavoriteItem[]): Promise<void> {
  await FavoritesModel.storeNewFavorites(newFavorites);
  FavoritesView.setTemporaryStatus(`Saved ${newFavorites.length} new favorites`);
}
