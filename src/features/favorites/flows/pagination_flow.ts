import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesView from "../view/favorites_view";
import { Favorite, PageRelation } from "../../../types/favorite";
import { Events } from "../../../lib/communication/events";
import { FavoritesPresentationFlow } from "../types/favorite_types";
import { NavigationKey } from "../../../types/input";
import { revealItem } from "../../../lib/ui/dom";

class PaginationFlow implements FavoritesPresentationFlow {
  private addedFirstResults = false;

  public present(results: Favorite[]): void {
    FavoritesView.setFavorites(results);
    FavoritesView.goToPage(1);
    this.showCurrentPage();
  }

  public goToPage(pageNumber: number): void {
    FavoritesView.goToPage(pageNumber);
    this.showCurrentPage();
  }

  public goToRelativePage(relativePage: PageRelation): void {
    if (FavoritesView.goToRelativePage(relativePage)) {
      this.showCurrentPage();
    }
  }

  public showCurrentPage(): void {
    FavoritesView.showSearchResults(FavoritesView.currentPageFavorites());
    FavoritesView.createPageSelectionMenu(FavoritesView.getPaginationParameters());
    FavoritesView.preloadThumbnails(FavoritesView.nextPageFavorites());
    FavoritesView.preloadThumbnails(FavoritesView.previousPageFavorites());
    Events.favorites.pageChanged.emit();
  }

  public onLayoutChanged(): void {
  }

  public reveal(id: string): void {
    if (FavoritesView.goToPageWithFavorite(id)) {
      this.showCurrentPage();
    }
    revealItem(id);
  }

  public presentWhileNavigatingGallery(direction: NavigationKey): boolean {
    this.goToAdjacentPage(direction);
    return true;
  }

  public reset(): void { }

  public handleNewSearchResults(): void {
    FavoritesView.setFavorites(FavoritesModel.getLatestSearchResults());
    FavoritesView.createPageSelectionMenuWhileFetching(FavoritesView.getPaginationParameters());
    this.addNewlyFetchedSearchResultsToCurrentPage();
    Events.favorites.searchResultsUpdated.emit();
  }

  private addNewlyFetchedSearchResultsToCurrentPage(): void {
    if (!FavoritesView.onFinalPage() && this.addedFirstResults) {
      return;
    }
    const favorites = FavoritesView.currentPageFavorites().filter(favorite => document.getElementById(favorite.id) === null);

    if (favorites.length > 0) {
      this.addedFirstResults = true;
    }
    const thumbs = favorites.map(favorite => favorite.root);

    FavoritesView.addToBottom(thumbs);
    Events.favorites.favoritesAddedToCurrentPage.emit(thumbs);
  }

  private goToAdjacentPage(direction: NavigationKey): void {
    if (FavoritesView.goToAdjacentPage(direction)) {
      this.showCurrentPage();
    }
  }
}

export const FavoritesPaginationFlow = new PaginationFlow();
export const goToPage = (pageNumber: number): void => FavoritesPaginationFlow.goToPage(pageNumber);
export const goToRelativePage = (relativePage: PageRelation): void => FavoritesPaginationFlow.goToRelativePage(relativePage);
