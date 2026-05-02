import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesView from "../view/favorites_view";
import { Favorite, FavoritesPageRelation } from "../../../types/favorite";
import { Events } from "../../../lib/communication/events";
import { FavoritesPresentationFlow } from "../type/favorite_types";
import { NavigationKey } from "../../../types/input";

class PaginationFlow implements FavoritesPresentationFlow {
    private addedFirstResults = false;

    public present(results: Favorite[]): void {
        FavoritesView.setFavorites(results);
        FavoritesView.gotoPage(1);
        this.showCurrentPage();
    }

    public gotoPage(pageNumber: number): void {
        FavoritesView.gotoPage(pageNumber);
        this.showCurrentPage();
    }

    public gotoRelativePage(relativePage: FavoritesPageRelation): void {
        if (FavoritesView.gotoRelativePage(relativePage)) {
            this.showCurrentPage();
        }
    }

    public showCurrentPage(): void {
        FavoritesView.showSearchResults(FavoritesView.getFavoritesOnCurrentPage());
        FavoritesView.createPageSelectionMenu(FavoritesView.getPaginationParameters());
        FavoritesView.preloadThumbnails(FavoritesView.getFavoritesOnNextPage());
        FavoritesView.preloadThumbnails(FavoritesView.getFavoritesOnPreviousPage());
        Events.favorites.pageChanged.emit();
    }

    public onLayoutChanged(): void {
    }

    public revealFavorite(id: string): void {
        if (FavoritesView.gotoPageWithFavorite(id)) {
            this.showCurrentPage();
        }
        FavoritesView.revealFavorite(id);
    }

    public loadNewFavoritesInGallery(direction: NavigationKey): boolean {
        this.gotoAdjacentPage(direction);
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
        const favorites = FavoritesView.getFavoritesOnCurrentPage().filter(favorite => document.getElementById(favorite.id) === null);

        if (favorites.length > 0) {
            this.addedFirstResults = true;
        }
        const thumbs = favorites.map(favorite => favorite.root);

        FavoritesView.insertNewSearchResults(thumbs);
        Events.favorites.favoritesAddedToCurrentPage.emit(thumbs);
    }

    private gotoAdjacentPage(direction: NavigationKey): void {
        if (FavoritesView.gotoAdjacentPage(direction)) {
            this.showCurrentPage();
        }
    }
}

export const FavoritesPaginationFlow = new PaginationFlow();

export const gotoPage = (pageNumber: number): void => FavoritesPaginationFlow.gotoPage(pageNumber);
export const gotoRelativePage = (relativePage: FavoritesPageRelation): void => FavoritesPaginationFlow.gotoRelativePage(relativePage);
