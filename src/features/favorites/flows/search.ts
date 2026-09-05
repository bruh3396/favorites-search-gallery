import * as FavoritesFlows from "@/features/favorites/flows/flows";
import * as FavoritesModel from "@/features/favorites/model/model";

export const searchFavorites = (searchQuery: string): void => FavoritesFlows.Display.display(FavoritesModel.searchFavorites(searchQuery));
export const reSearchFavorites = (): void => FavoritesFlows.Display.display(FavoritesModel.reSearchFavorites(), { fade: false });
export const shuffleSearchResults = (): void => FavoritesFlows.Display.display(FavoritesModel.shuffleSearchResults());
export const invertSearchResults = (): void => FavoritesFlows.Display.display(FavoritesModel.invertSearchResults());
