import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesView from "../../../view/favorites_view";
import { Events } from "../../../../../lib/global/events/events";
import { FavoriteItem } from "../../../types/favorite/favorite_item";
import { FavoritesPageRelation } from "../../../types/favorite/favorite_types";
import { FavoritesPresentationFlow } from "../../../types/favorites_presentation_flow_interface";
import { NavigationKey } from "../../../../../types/common_types";

class PaginationFlow implements FavoritesPresentationFlow {
    private addedFirstResults = false;

    public present(results: FavoriteItem[]): void {
        FavoritesModel.paginate(results);
        FavoritesModel.changePage(1);
        this.showCurrentPage();
    }

    public gotoPage(pageNumber: number): void {
        FavoritesModel.changePage(pageNumber);
        this.showCurrentPage();
    }

    public gotoRelativePage(relativePage: FavoritesPageRelation): void {
        if (FavoritesModel.gotoRelativePage(relativePage)) {
            this.showCurrentPage();
        }
    }

    public showCurrentPage(): void {
        FavoritesView.showSearchResults(FavoritesModel.getFavoritesOnCurrentPage());
        FavoritesView.createPageSelectionMenu(FavoritesModel.getPaginationParameters());
        FavoritesView.preloadThumbnails(FavoritesModel.getFavoritesOnNextPage());
        FavoritesView.preloadThumbnails(FavoritesModel.getFavoritesOnPreviousPage());
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

    public loadNewFavoritesInGallery(direction: NavigationKey): boolean {
        this.gotoAdjacentPage(direction);
        return true;
    }

    public reset(): void { }

    public handleNewSearchResults(): void {
        FavoritesModel.paginate(FavoritesModel.getLatestSearchResults());
        FavoritesView.createPageSelectionMenuWhileFetching(FavoritesModel.getPaginationParameters());
        this.addNewlyFetchedSearchResultsToCurrentPage();
        Events.favorites.searchResultsUpdated.emit();
    }

    public addNewlyFetchedSearchResultsToCurrentPage(): void {
        if (!FavoritesModel.onFinalPage() && this.addedFirstResults) {
            return;
        }
        const newFavorites = FavoritesModel.getFavoritesOnCurrentPage()
            .filter(favorite => document.getElementById(favorite.id) === null);

        if (newFavorites.length > 0) {
            this.addedFirstResults = true;
        }

        const thumbs = newFavorites.map(favorite => favorite.root);

        FavoritesView.insertNewSearchResults(thumbs);
        Events.favorites.favoritesAddedToCurrentPage.emit(thumbs);
    }

    private gotoAdjacentPage(direction: NavigationKey): void {
        if (FavoritesModel.gotoAdjacentPage(direction)) {
            this.showCurrentPage();
        }
    }
}

export const FavoritesPaginationFlow = new PaginationFlow();
