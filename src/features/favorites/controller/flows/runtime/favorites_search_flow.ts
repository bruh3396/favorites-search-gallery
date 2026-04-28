import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesPresentationFlow from "../presentation/favorites_presentation_flow";
import * as FavoritesView from "../../../view/favorites_view";
import { Events } from "../../../../../lib/events/events";
import { FavoriteItem } from "../../../types/favorite_item";

export function showSearchResults(searchResults: FavoriteItem[]): void {
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

export function findFavoriteInAll(id: string): void {
  searchFavorites("");
  FavoritesPresentationFlow.revealFavorite(id);
}
