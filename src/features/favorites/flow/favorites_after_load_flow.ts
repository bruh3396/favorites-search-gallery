import * as FavoritesModel from "../model/favorites_model";
import { collectAspectRatios } from "../view/skeleton/favorites_aspect_ratio_collector";

export function onFavoritesLoaded(): void {
  FavoritesModel.onFinishedStoringAllFavorites();
  FavoritesModel.updateMissingMetadata();
  collectAspectRatios();
  FavoritesModel.buildSearchIndexAsync();
}

export function onStartedStoringAllFavorites(): void {
  FavoritesModel.onStartedStoringAllFavorites();
}
