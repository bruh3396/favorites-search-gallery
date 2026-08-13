import * as FavoritesDisplayFlow from "@/features/favorites/flows/display_flow";
import * as FavoritesModel from "@/features/favorites/model/favorites_model";

export const searchFavorites = (searchQuery: string): void => FavoritesDisplayFlow.display(FavoritesModel.searchScopedFavorites(searchQuery));
export const reSearchFavorites = (): void => FavoritesDisplayFlow.display(FavoritesModel.reSearchScopedFavorites(), { fade: false });
export const shuffleSearchResults = (): void => FavoritesDisplayFlow.display(FavoritesModel.shuffleSearchResults());
export const invertSearchResults = (): void => FavoritesDisplayFlow.display(FavoritesModel.invertSearchResults());
