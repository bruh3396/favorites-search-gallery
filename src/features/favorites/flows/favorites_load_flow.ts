import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesPresentationFlow from "./presentation/favorites_presentation_flow";
import * as FavoritesSearchFlow from "./favorites_search_flow";
import * as FavoritesView from "../view/favorites_view";
import {Events} from "../../../lib/functional/events";
import {FavoriteItem} from "../types/favorite/favorite_item";

export async function loadAllFavorites(): Promise<void> {
  await loadAllFavoritesFromDatabase();

  if (hasNoFavorites()) {
    await fetchAllFavorites();
    await saveAllFavorites();
  } else {
    showLoadedFavorites();
    await loadNewFavorites();
  }
  Events.favorites.favoritesLoaded.emit();
}

async function loadAllFavoritesFromDatabase(): Promise<void> {
  FavoritesView.showNotification("Loading favorites");
  await FavoritesModel.loadAllFavoritesFromDatabase();

  if (hasFavorites()) {
    Events.favorites.favoritesLoadedFromDatabase.emit();
  }
}

function hasFavorites(): boolean {
  return FavoritesModel.getAllFavorites().length > 0;
}

function hasNoFavorites(): boolean {
  return !hasFavorites();
}

async function fetchAllFavorites(): Promise<void> {
  FavoritesPresentationFlow.clear();
  Events.favorites.startedFetchingFavorites.emit();
  await FavoritesModel.fetchAllFavorites(processFetchedFavorites);
}

async function saveAllFavorites(): Promise<void> {
  FavoritesView.showNotification("Saving favorites");
  await FavoritesModel.storeAllFavorites();
  FavoritesView.showTemporaryNotification("All favorites saved");
}

function showLoadedFavorites(): void {
  FavoritesView.showTemporaryNotification("Favorites loaded");
  FavoritesSearchFlow.showLatestSearchResults();
}

function processFetchedFavorites(): void {
  FavoritesView.updateStatusWhileFetching(FavoritesModel.getLatestSearchResults().length, FavoritesModel.getAllFavorites().length);
  Events.favorites.searchResultsUpdated.emit(FavoritesModel.getLatestSearchResults());
  FavoritesPresentationFlow.handleNewSearchResults();
}

async function loadNewFavorites(): Promise<void> {
  const results = await FavoritesModel.findNewFavoritesOnReload();

  if (results.newSearchResults.length === 0) {
    return;
  }
  FavoritesView.insertNewSearchResultsOnReload(results);
  saveNewFavorites(results.newFavorites);
  FavoritesModel.paginate(FavoritesModel.getLatestSearchResults());
  Events.favorites.newFavoritesFoundOnReload.emit(results.newSearchResults);
  Events.favorites.searchResultsUpdated.emit(results.allSearchResults);
}

async function saveNewFavorites(newFavorites: FavoriteItem[]): Promise<void> {
  await FavoritesModel.storeNewFavorites(newFavorites);
  FavoritesView.showTemporaryNotification("New favorites saved");
}
