import * as FavoritesModel from "../../model/model";
import * as FavoritesView from "../../view/view";
import {Events} from "../../../../lib/functional/events";
import {FavoriteItem} from "../../types/favorite/favorite";
import {FavoritesPresenter} from "./presenter";
import {NavigationKey} from "../../../../types/primitives/primitives";

class PaginationPresenter implements FavoritesPresenter {
    public present(results: FavoriteItem[]): void {
        FavoritesModel.paginate(results);
        FavoritesModel.changePage(1);
        this.showCurrentPage();
    }

    public showCurrentPage(): void {
        FavoritesView.showSearchResults(FavoritesModel.getFavoritesOnCurrentPage());
        FavoritesView.createPageSelectionMenu(FavoritesModel.getPaginationParameters());
        Events.favorites.pageChanged.emit();
    }

    private showCurrentPageWithoutMenu(): void {
        FavoritesView.showSearchResults(FavoritesModel.getFavoritesOnCurrentPage());
        Events.favorites.pageChanged.emit();
    }

    public changeLayout(): void {
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

    private gotoAdjacentPage(direction: NavigationKey): void {
        if (FavoritesModel.gotoAdjacentPage(direction)) {
            this.showCurrentPage();
        }
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
}

export const FavoritesPaginationPresenter = new PaginationPresenter();
