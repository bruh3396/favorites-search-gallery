import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { ContentDisplayOptions } from "@/types/ui";
import { Favorite } from "@/types/favorite";
import { FavoritesDisplay } from "@/features/favorites/types/types";
import { FavoritesInfiniteDisplay } from "@/features/favorites/flows/infinite_display";
import { FavoritesPaginatedDisplay } from "@/features/favorites/flows/paginated_display";
import { NavigationKey } from "@/types/input";
import { Preferences } from "@/app/context/preferences";

export function display(favorites: Favorite[], options?: ContentDisplayOptions): void {
  FavoritesView.setMatchCount(favorites.length);
  activeDisplay().initialize(favorites, options);
}

export function sync(favorites: Favorite[]): void {
  FavoritesView.updateFetchStatus(
    FavoritesModel.getAllFavorites().length,
    FavoritesModel.getCurrentSearchResults().length
  );
  activeDisplay().sync(favorites);
}

export function toggleInfiniteScroll(): void {
  inactiveDisplay().teardown();
  redisplayLatestResults();
}

export const redisplayLatestResults = (): void => display(FavoritesModel.getCurrentSearchResults(), { fade: false });
export const clear = (): void => display([]);
export const advance = (direction: NavigationKey): boolean => activeDisplay().advance(direction);
export const goToPage = (pageNumber: number): void => activeDisplay().goToPage(pageNumber);

const activeDisplay = (): FavoritesDisplay => (Preferences.favorites.infiniteScroll.value ? FavoritesInfiniteDisplay : FavoritesPaginatedDisplay);
const inactiveDisplay = (): FavoritesDisplay => (activeDisplay() === FavoritesInfiniteDisplay ? FavoritesPaginatedDisplay : FavoritesInfiniteDisplay);
