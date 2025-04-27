import {EmptyFavoritesDatabaseError, PromiseChainExitError} from "../types/errors";
import {Events} from "../../../lib/functional/events";
import {FavoriteItem} from "../types/favorite/favorite";
import {FavoritesModel} from "../model/model";
import {FavoritesPresenter} from "./presentation/presenter";
import {FavoritesView} from "../view/view";
import {InfiniteScrollPresenter} from "./presentation/infinite_scroll_presenter";
import {PaginationPresenter} from "./presentation/pagination_presenter";
import {addFavoritesPageEventListeners} from "./event_listeners/event_listeners";
import {buildFavoritesPage} from "../page_builder/builder";

function getPresenter(): FavoritesPresenter {
  return FavoritesModel.usingInfiniteScroll() ? InfiniteScrollPresenter : PaginationPresenter;
}

function loadAllFavorites(): void {
  FavoritesModel.loadAllFavorites()
    .then((searchResults) => {
      processLoadedSearchResults(searchResults);
      Events.favorites.favoritesLoadedFromDatabase.emit();
      return FavoritesModel.findNewFavoritesOnReload();
    })
    .then((newFavoritesFound) => {
      processFavoritesFoundOnReload(newFavoritesFound);
      throw new PromiseChainExitError();
    })
    .catch((emptyFavoritesDatabaseError) => {
      return findAllFavorites(emptyFavoritesDatabaseError);
    })
    .then(() => {
      onAllFavoritesFound();
      throw new PromiseChainExitError();
    })
    .catch((error) => {
      if (!(error instanceof PromiseChainExitError)) {
        throw error;
      }
      Events.favorites.favoritesLoaded.emit();
    });
}

// async function loadAllFavorites2(): void {
//   // const loadedSearchResults = await FavoritesModel.loadAllFavorites();
// }

function processLoadedSearchResults(searchResults: FavoriteItem[]): void {
  showSearchResults(searchResults);
}

function processFavoritesFoundOnReload(results: { newFavorites: FavoriteItem[]; newSearchResults: FavoriteItem[]; allSearchResults: FavoriteItem[] }): void {
  FavoritesView.insertNewSearchResultsOnReload(results);
  FavoritesModel.storeNewFavorites(results.newFavorites)
    .then(() => {
      if (results.newFavorites.length > 0) {
        FavoritesView.showNotification("New favorites saved");
      }
    });
  FavoritesModel.paginate(FavoritesModel.getLatestSearchResults());
  Events.favorites.newFavoritesFoundOnReload.emit(results.newSearchResults);
  Events.favorites.searchResultsUpdated.emit(results.allSearchResults);
}

function findAllFavorites(error: Error): Promise<void> {
  if ((error instanceof EmptyFavoritesDatabaseError)) {
    getPresenter().present([]);
    Events.favorites.startedFetchingFavorites.emit();
    return FavoritesModel.fetchAllFavorites(onSearchResultsFound);
  }
  throw error;
}

function onAllFavoritesFound(): void {
  FavoritesView.showNotification("Saving favorites");
  FavoritesModel.storeAllFavorites()
    .then(() => {
      FavoritesView.showNotification("All favorites saved");
    });
}

function onSearchResultsFound(): void {
  FavoritesView.updateStatusWhileFetching(FavoritesModel.getLatestSearchResults().length, FavoritesModel.getAllFavorites().length);
  Events.favorites.searchResultsUpdated.emit(FavoritesModel.getLatestSearchResults());
  getPresenter().handleNewSearchResults();
}

function searchFavorites(searchQuery: string): void {
  showSearchResults(FavoritesModel.getSearchResults(searchQuery));
}

function showSearchResults(searchResults: FavoriteItem[]): void {
  Events.favorites.searchResultsUpdated.emit(searchResults);
  FavoritesView.setMatchCount(searchResults.length);
  getPresenter().present(searchResults);
}

function findFavorite(id: string): void {
  getPresenter().revealFavorite(id);
}

function toggleInfiniteScroll(value: boolean): void {
  resetPresentation();
  FavoritesModel.toggleInfiniteScroll(value);
  FavoritesView.togglePaginationMenu(!value);
  showSearchResults(FavoritesModel.getLatestSearchResults());
}

function resetPresentation(): void {
  for (const controller of [InfiniteScrollPresenter, PaginationPresenter]) {
    controller.reset();
  }
}

export function setupFavoritesPage(): void {
  buildFavoritesPage();
  FavoritesModel.setup();
  FavoritesView.setup();
  PaginationPresenter.setup();
  InfiniteScrollPresenter.setup();
  addFavoritesPageEventListeners();
  loadAllFavorites();
}

export const FavoritesController = {
  searchFavorites,
  showSearchResults,
  findFavorite,
  toggleInfiniteScroll,
  getPresenter
};
