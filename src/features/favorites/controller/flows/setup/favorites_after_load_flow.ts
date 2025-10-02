import * as FavoritesModel from "../../../model/favorites_model";
import * as FavoritesView from "../../../view/favorites_view";

export function onFavoritesLoaded(): void {
  FavoritesModel.fetchMissingMetadata();
  FavoritesView.collectAspectRatios();
  FavoritesModel.buildSearchIndexAsynchronously();
}

export function onStartedFetchingFavorites(): void {
  FavoritesModel.keepIndexedTagsSorted();
  FavoritesModel.buildSearchIndexSynchronously();
}
