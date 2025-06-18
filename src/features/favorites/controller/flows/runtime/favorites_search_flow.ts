import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesPresentationFlow from "../presentation/favorites_presentation_flow";
import * as FavoritesView from "../../../view/favorites_view";
import { Events } from "../../../../../lib/globals/events";
import { FavoriteItem } from "../../../types/favorite/favorite_item";

export function showSearchResults(searchResults: FavoriteItem[]): void {
  Events.favorites.searchResultsUpdated.emit(searchResults);
  FavoritesView.setMatchCount(searchResults.length);
  FavoritesPresentationFlow.present(searchResults);
}

export function searchFavorites(searchQuery: string): void {
  showSearchResults(FavoritesModel.getSearchResults(searchQuery));
}

export function searchFavoritesUsingLatestQuery(): void {
  showSearchResults(FavoritesModel.getSearchResultsFromLatestQuery());
}

export function showLatestSearchResults(): void {
  showSearchResults(FavoritesModel.getLatestSearchResults());
}

export function shuffleSearchResults(): void {
  showSearchResults(FavoritesModel.getShuffledSearchResults());
}

export function invertSearchResults(): void {
  FavoritesModel.invertSearchResults();
  showLatestSearchResults();
}
