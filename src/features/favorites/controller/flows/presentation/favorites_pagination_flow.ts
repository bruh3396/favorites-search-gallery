import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesView from "../../../view/favorites_view";
import { Events } from "../../../../../lib/communication/events/events";
import { FavoriteItem } from "../../../types/favorite_item";
import { FavoritesPageRelation } from "../../../../../types/favorite";
import { FavoritesPresentationFlow } from "../../../types/favorite_types";
import { NavigationKey } from "../../../../../types/input";

class PaginationFlow implements FavoritesPresentationFlow {
    private addedFirstResults = false;

    public present(results: FavoriteItem[]): void {
        FavoritesView.paginate(results);
        FavoritesView.changePage(1);
        this.showCurrentPage();
    }

    public gotoPage(pageNumber: number): void {
        FavoritesView.changePage(pageNumber);
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
        FavoritesView.paginate(FavoritesModel.getLatestSearchResults());
        FavoritesView.createPageSelectionMenuWhileFetching(FavoritesView.getPaginationParameters());
        this.addNewlyFetchedSearchResultsToCurrentPage();
        Events.favorites.searchResultsUpdated.emit();
    }

    public addNewlyFetchedSearchResultsToCurrentPage(): void {
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
