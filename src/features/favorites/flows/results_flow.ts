import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesView from "../view/favorites_view";
import { Events } from "../../../lib/communication/events";
import { Favorite } from "../../../types/favorite";
import { FavoritesInfiniteScrollView } from "./infinite_scroll_results_flow";
import { FavoritesPaginatedView } from "./paginated_results_flow";
import { FavoritesResultsView } from "../types/favorite_types";
import { NavigationKey } from "../../../types/input";
import { Preferences } from "../../../lib/preferences/preferences";

export const showResults = (favorites: Favorite[]): void => activeView().initialize(favorites);
export const clearResults = (): void => activeView().initialize([]);
export const reveal = (id: string): void => activeView().reveal(id);
export const loadMoreResults = (direction: NavigationKey): void => activeView().loadMore(direction);
export const hasMoreResults = (): boolean => activeView().hasMore();

export function syncResults(): void {
  Events.favorites.searchResultsUpdated.emit();
  FavoritesView.updateStatus({
    resultsCount: FavoritesModel.getCurrentSearchResults().length,
    allFavoritesCount: FavoritesModel.getAllFavorites().length
  });
  activeView().sync();
}

const activeView = (): FavoritesResultsView => (Preferences.infiniteScroll.value ? FavoritesInfiniteScrollView : FavoritesPaginatedView);
