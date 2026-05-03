import * as FavoritesModel from "../model/favorites_model";
import * as FavoritesPresentationFlow from "./favorites_presentation_flow";
import * as FavoritesView from "../view/favorites_view";
import { Events } from "../../../lib/communication/events";
import { Favorite } from "../../../types/favorite";

export function showSearchResults(searchResults: Favorite[]): void {
  Events.favorites.searchResultsUpdated.emit();
  FavoritesView.setMatchCount(searchResults.length);
  FavoritesPresentationFlow.present(searchResults);
}

export function searchFavorites(searchQuery?: string): void {
  showSearchResults(FavoritesModel.searchFavorites(searchQuery));
}

export function showLatestSearchResults(): void {
  showSearchResults(FavoritesModel.getLatestSearchResults());
}

export function shuffleSearchResults(): void {
  showSearchResults(FavoritesModel.shuffleSearchResults());
}

export function invertSearchResults(): void {
  showSearchResults(FavoritesModel.invertSearchResults());
}

export function revealFavoriteInAll(id: string): void {
  searchFavorites("");
  FavoritesPresentationFlow.reveal(id);
}
