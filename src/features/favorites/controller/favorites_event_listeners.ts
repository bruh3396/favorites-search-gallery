import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesSearchFlow from "../flows/favorites_search_flow";
import {Events} from "../../../lib/functional/events";
import {FavoritesPaginationFlow} from "../flows/presentation/favorites_pagination_flow";

export function addEventListenersToFavoritesPage(): void {
  // addEventListenersToMainMenu();
  Events.favorites.searchStarted.on(FavoritesSearchFlow.searchFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesSearchFlow.shuffleSearchResults);
  Events.favorites.reset.on(FavoritesModel.deleteDatabase);
  Events.favorites.pageSelected.on(FavoritesPaginationFlow.gotoPage.bind(FavoritesPaginationFlow));
  Events.favorites.relativePageSelected.on(FavoritesPaginationFlow.gotoRelativePage.bind(FavoritesPaginationFlow));
  Events.favorites.favoriteRemoved.on(FavoritesModel.deleteFavorite);
  Events.favorites.favoritesLoadedFromDatabase.on(FavoritesModel.sortSearchIndexOnAdd);
  Events.favorites.startedFetchingFavorites.on(FavoritesModel.sortSearchIndexOnAdd);
  addGlobalEventListeners();
  addKeyDownEventListeners();
}

function addGlobalEventListeners(): void {
  setupPageChangingInGallery();
  updateMissingMetadataWhenAvailable();
  updateLayoutWhenOptionsChange();
}

// function addEventListenersToMainMenu() { }

// function addButtonEventListenersToMainMenu() { }

// function addCheckboxEventListenersToMainMenu() { }

// function addNumericEventListenersToMainMenu() { }

// function addOtherEventListenersToMainMenu() { }

function setupPageChangingInGallery(): void {
  // Events.gallery.requestPageChange.on((direction) => {
  //   FavoritesSearchFlow.getPresentationController().handlePageChangeRequest(direction);
  // });
}

function updateMissingMetadataWhenAvailable(): void {
  Events.favorites.missingMetadataFound.on((id) => {
    FavoritesModel.updateMetadata(id);
  });
}

function updateLayoutWhenOptionsChange(): void {
  // window.addEventListener("resize", Utils.debounceAfterFirstCall(() => {
  //   const columnInput = document.getElementById("column-count");
  //   const rowInput = document.getElementById("row-size");

  //   if (columnInput instanceof HTMLInputElement) {
  //     FavoritesView.updateColumnCount(parseFloat(columnInput.value));
  //   }

  //   if (rowInput instanceof HTMLInputElement) {
  //     FavoritesView.updateRowSize(parseFloat(rowInput.value));
  //   }
  // }, 100));
}

function addKeyDownEventListeners(): void {
  // Events.global.keydown.on(async (event) => {
  //   if (!event.isHotkey) {
  //     return;
  //   }

  //   if (event.originalEvent.key !== "ArrowRight" && event.originalEvent.key !== "ArrowLeft") {
  //     return;
  //   }
  //   const inGallery = await Utils.inGallery();

  //   if (inGallery) {
  //     return;
  //   }
  //   this.displayController.gotoAdjacentPageDebounced(event.originalEvent.key);
  // });
}
