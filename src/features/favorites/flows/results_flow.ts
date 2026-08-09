import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { Events } from "@/app/channels/events";
import { Favorite } from "@/types/favorite";
import { FavoritesInfiniteScrollView } from "@/features/favorites/flows/infinite_scroll_results_flow";
import { FavoritesPaginatedView } from "@/features/favorites/flows/paginated_results_flow";
import { FavoritesResultsView } from "@/features/favorites/types/types";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";

export const showResults = (favorites: Favorite[]): void => activeView().initialize(favorites);
export const clearResults = (): void => activeView().initialize([]);
export const reveal = (id: string): void => activeView().reveal(id);
export const loadMoreResults = (direction: NavigationKey): boolean => activeView().loadMore(direction);

export function syncResults(newFavorites: Favorite[]): void {
  const currentSearchResults = FavoritesModel.getCurrentSearchResults();

  Events.favorites.searchResultsUpdated.emit(currentSearchResults);
  FavoritesView.updateStatus({
    resultsCount: currentSearchResults.length,
    allFavoritesCount: FavoritesModel.getAllFavorites().length
  });
  activeView().sync(newFavorites);
}

const activeView = (): FavoritesResultsView => (Preferences.favorites.infiniteScroll.value ? FavoritesInfiniteScrollView : FavoritesPaginatedView);
