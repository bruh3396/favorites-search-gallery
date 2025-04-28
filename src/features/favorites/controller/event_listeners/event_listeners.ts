import * as FavoritesController from "../flow/controller";
import * as FavoritesModel from "../../model/model";
import {Events} from "../../../../lib/functional/events";
import {FavoritesPaginationPresenter} from "../presentation/pagination_presenter";

export function addFavoritesPageEventListeners(): void {
  // addEventListenersToMainMenu();
  Events.favorites.searchStarted.on(FavoritesController.searchFavorites);
  Events.favorites.shuffleButtonClicked.on(FavoritesController.shuffleSearchResults);
  Events.favorites.reset.on(FavoritesModel.deleteDatabase);

  Events.favorites.pageSelected.on((pageNumber) => {
    FavoritesModel.changePage(pageNumber);
    FavoritesPaginationPresenter.showCurrentPage();
  });
  Events.favorites.relativePageSelected.on((relativePage) => {
    if (FavoritesModel.gotoRelativePage(relativePage)) {
      FavoritesPaginationPresenter.showCurrentPage();
    }
  });
  addGlobalEventListeners();
  addKeyDownEventListeners();
}

function addGlobalEventListeners(): void {
  setupPageChangingInGallery();
  updateMissingMetadataWhenAvailable();
  updateLayoutWhenOptionsChange();
  updateDatabaseWhenFavoriteRemoved();
  deleteDatabaseOnReset();
}

// function addEventListenersToMainMenu() { }

// function addButtonEventListenersToMainMenu() { }

// function addCheckboxEventListenersToMainMenu() { }

// function addNumericEventListenersToMainMenu() { }

// function addOtherEventListenersToMainMenu() { }

function setupPageChangingInGallery(): void {
  Events.gallery.requestPageChange.on((direction) => {
    FavoritesController.getPresenter().handlePageChangeRequest(direction);
  });
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

function updateDatabaseWhenFavoriteRemoved(): void {
  Events.favorites.favoriteRemoved.on(async(id) => {
    await FavoritesModel.deleteFavorite(id);
  });
}

function deleteDatabaseOnReset(): void {
  Events.favorites.reset.on(() => {
    FavoritesModel.deleteDatabase();
  });
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
