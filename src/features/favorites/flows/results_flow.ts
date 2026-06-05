import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { Events } from "@/app/channels/events";
import { Favorite } from "@/types/favorite";
import { FavoritesInfiniteScrollView } from "@/features/favorites/flows/infinite_scroll_results_flow";
import { FavoritesPaginatedView } from "@/features/favorites/flows/paginated_results_flow";
import { FavoritesResultsView } from "@/features/favorites/types/favorite_types";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";

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

const activeView = (): FavoritesResultsView => (Preferences.favoritesInfiniteScroll.value ? FavoritesInfiniteScrollView : FavoritesPaginatedView);
