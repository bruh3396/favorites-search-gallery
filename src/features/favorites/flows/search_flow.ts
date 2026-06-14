import * as FavoritesModel from "@/features/favorites/model/favorites_model";
import * as FavoritesResultsFlow from "@/features/favorites/flows/results_flow";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { Events } from "@/app/channels/events";
import { Favorite } from "@/types/favorite";

export function showSearchResults(searchResults: Favorite[]): void {
  Events.favorites.searchResultsUpdated.emit(searchResults);
  FavoritesView.setMatchCount(searchResults.length);
  FavoritesResultsFlow.showResults(searchResults);
}

export function revealFavoriteInAll(id: string): void {
  searchActiveFavorites("");
  FavoritesResultsFlow.reveal(id);
}

export const searchActiveFavorites = (searchQuery?: string): void => showSearchResults(FavoritesModel.searchActiveFavorites(searchQuery));
export const showLatestSearchResults = (): void => showSearchResults(FavoritesModel.getCurrentSearchResults());
export const shuffleSearchResults = (): void => showSearchResults(FavoritesModel.shuffleSearchResults());
export const invertSearchResults = (): void => showSearchResults(FavoritesModel.invertSearchResults());
