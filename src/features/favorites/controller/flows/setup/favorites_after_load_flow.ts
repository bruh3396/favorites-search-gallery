import * as FavoritesModel from "../../../model/favorites_model";
import { collectAspectRatios } from "../../../ui/skeleton/favorites_skeleton_aspect_ratio_collector";

export function onFavoritesLoaded(): void {
  FavoritesModel.updateMissingMetadata();
  collectAspectRatios();
  FavoritesModel.buildSearchIndexAsync();
}

export function onFavoritesLoadedFromDatabase(): void {
  FavoritesModel.keepSearchIndexTagsSorted();
}

export function onStartedFetchingFavorites(): void {
  FavoritesModel.keepSearchIndexTagsSorted();
  FavoritesModel.buildSearchIndexSync();
}

export function onStartedStoringAllFavorites(): void {
  FavoritesModel.onStartedStoringAllFavorites();
}
