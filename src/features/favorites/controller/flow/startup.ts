import * as FavoritesController from "./controller";
import * as FavoritesModel from "../../model/model";
import * as FavoritesView from "../../view/view";
import {Events} from "../../../../lib/functional/events";
import {FavoriteItem} from "../../types/favorite/favorite";
import {sleep} from "../../../../utils/misc/generic";

export async function loadAllFavorites(): Promise<void> {
  FavoritesView.showNotification("Loading favorites");
  const favoritesLoadedFromDatabase = await FavoritesModel.loadAllFavorites();

  await sleep(3000);

  if (favoritesLoadedFromDatabase.length === 0) {
    await findAllFavorites().then(onAllFavoritesFound);
  } else {
    FavoritesView.showNotification("Favorites loaded");
    FavoritesController.showSearchResults(favoritesLoadedFromDatabase);
    Events.favorites.favoritesLoadedFromDatabase.emit();
    await FavoritesModel.findNewFavoritesOnReload().then(processFavoritesFoundOnReload);
  }
  Events.favorites.favoritesLoaded.emit();
}

async function processFavoritesFoundOnReload(results: { newFavorites: FavoriteItem[]; newSearchResults: FavoriteItem[]; allSearchResults: FavoriteItem[] }): Promise<void> {
  FavoritesView.insertNewSearchResultsOnReload(results);
  await FavoritesModel.storeNewFavorites(results.newFavorites);

  if (results.newFavorites.length > 0) {
    FavoritesView.showNotification("New favorites saved");
  }
  FavoritesModel.paginate(FavoritesModel.getLatestSearchResults());
  Events.favorites.newFavoritesFoundOnReload.emit(results.newSearchResults);
  Events.favorites.searchResultsUpdated.emit(results.allSearchResults);
}

function findAllFavorites(): Promise<void> {
  FavoritesController.getPresenter().present([]);
  Events.favorites.startedFetchingFavorites.emit();
  return FavoritesModel.fetchAllFavorites(onSearchResultsFound);
}

async function onAllFavoritesFound(): Promise<void> {
  FavoritesView.showNotification("Saving favorites");
  await FavoritesModel.storeAllFavorites();
  FavoritesView.showNotification("All favorites saved");
}

function onSearchResultsFound(): void {
  FavoritesView.updateStatusWhileFetching(FavoritesModel.getLatestSearchResults().length, FavoritesModel.getAllFavorites().length);
  Events.favorites.searchResultsUpdated.emit(FavoritesModel.getLatestSearchResults());
  FavoritesController.getPresenter().handleNewSearchResults();
}
