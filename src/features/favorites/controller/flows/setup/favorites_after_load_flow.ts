import * as FavoritesModel from "../../../model/favorites_model";
import { collectAspectRatios } from "../../../../../lib/global/content/skeleton/aspect_ratio_collector";

export function onFavoritesLoaded(): void {
  FavoritesModel.updateMissingMetadata();
  collectAspectRatios();
  FavoritesModel.buildSearchIndexAsynchronously();
}

export function onFavoritesLoadedFromDatabase(): void {
  FavoritesModel.keepIndexedTagsSorted();
}

export function onStartedFetchingFavorites(): void {
  FavoritesModel.keepIndexedTagsSorted();
  FavoritesModel.buildSearchIndexSynchronously();
}

export function onStartedStoringAllFavorites(): void {
  FavoritesModel.onStartedStoringFavorites();
}
