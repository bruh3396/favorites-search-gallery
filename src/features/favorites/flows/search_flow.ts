import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesPresentationFlow from "./presentation_flow";
import * as FavoritesView from "../view/favorites_view";
import { Events } from "../../../lib/communication/events";
import { Favorite } from "../../../types/favorite";

export function showSearchResults(searchResults: Favorite[]): void {
  Events.favorites.searchResultsUpdated.emit();
  FavoritesView.setMatchCount(searchResults.length);
  FavoritesPresentationFlow.present(searchResults);
}

export function revealFavoriteInAll(id: string): void {
  searchFavorites("");
  FavoritesPresentationFlow.reveal(id);
}

export const searchFavorites = (searchQuery?: string): void => showSearchResults(FavoritesModel.searchFavorites(searchQuery));
export const showLatestSearchResults = (): void => showSearchResults(FavoritesModel.getLatestSearchResults());
export const shuffleSearchResults = (): void => showSearchResults(FavoritesModel.shuffleSearchResults());
export const invertSearchResults = (): void => showSearchResults(FavoritesModel.invertSearchResults());
