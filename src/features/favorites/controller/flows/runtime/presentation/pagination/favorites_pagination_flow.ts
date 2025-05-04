import * as FavoritesModel from "../../../../../model/favorites_model";
import * as FavoritesView from "../../../../../view/favorites_view";
import { Events } from "../../../../../../../lib/globals/events";
import { FavoriteItem } from "../../../../../types/favorite/favorite_item";
import { FavoritesPresentationFlow } from "../favorites_presentation_flow_interface";
import { NavigationKey } from "../../../../../../../types/primitives/primitives";

class PaginationFlow implements FavoritesPresentationFlow {
    public present(results: FavoriteItem[]): void {
        FavoritesModel.paginate(results);
        FavoritesModel.changePage(1);
        this.showCurrentPage();
    }

    public gotoPage(pageNumber: number): void {
        FavoritesModel.changePage(pageNumber);
        this.showCurrentPage();
    }

    public gotoRelativePage(relativePage: string): void {
        if (FavoritesModel.gotoRelativePage(relativePage)) {
            FavoritesPaginationFlow.showCurrentPage();
        }
    }

    public showCurrentPage(): void {
        FavoritesView.showSearchResults(FavoritesModel.getFavoritesOnCurrentPage());
        FavoritesView.createPageSelectionMenu(FavoritesModel.getPaginationParameters());
        FavoritesView.preloadFavorites(FavoritesModel.getFavoritesOnNextPage());
        FavoritesView.preloadFavorites(FavoritesModel.getFavoritesOnPreviousPage());
        Events.favorites.pageChanged.emit();
    }

    public onLayoutChanged(): void {
    }

    public revealFavorite(id: string): void {
        if (FavoritesModel.gotoPageWithFavoriteId(id)) {
            this.showCurrentPage();
        }
        FavoritesView.revealFavorite(id);
    }

    public handlePageChangeRequest(direction: NavigationKey): void {
        this.gotoAdjacentPage(direction);
        Events.favorites.pageChangeResponse.emit();
    }

    // private gotoAdjacentPageDebounced(direction: NavigationKey): void {
    //     // if (FavoritesModel.gotoAdjacentPage(direction)) {
    //     //     FavoritesView.createPageSelectionMenu(FavoritesModel.getPaginationParameters());
    //     //     this.debouncedShowCurrentPage();
    //     // }
    // }

    public reset(): void {
    }

    public handleNewSearchResults(): void {
        FavoritesModel.paginate(FavoritesModel.getLatestSearchResults());
        FavoritesView.createPageSelectionMenuWhileFetching(FavoritesModel.getPaginationParameters());
        this.addNewlyFetchedSearchResultsToCurrentPage();
        Events.favorites.searchResultsUpdated.emit(FavoritesModel.getLatestSearchResults());
    }

    public addNewlyFetchedSearchResultsToCurrentPage(): void {
        if (!FavoritesModel.onFinalPage()) {
            return;
        }
        const newFavorites = FavoritesModel.getFavoritesOnCurrentPage()
            .filter(favorite => document.getElementById(favorite.id) === null);
        const thumbs = newFavorites.map(favorite => favorite.root);

        FavoritesView.insertNewSearchResults(thumbs);
        Events.favorites.resultsAddedToCurrentPage.emit(thumbs);
    }

    private showCurrentPageWithoutMenu(): void {
        FavoritesView.showSearchResults(FavoritesModel.getFavoritesOnCurrentPage());
        Events.favorites.pageChanged.emit();
    }

    private gotoAdjacentPage(direction: NavigationKey): void {
        if (FavoritesModel.gotoAdjacentPage(direction)) {
            this.showCurrentPage();
        }
    }
}

export const FavoritesPaginationFlow = new PaginationFlow();
