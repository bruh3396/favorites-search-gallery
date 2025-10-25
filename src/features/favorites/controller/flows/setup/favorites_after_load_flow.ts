import * as FavoritesModel from "../../../model/favorites_model";
import { collectAspectRatios } from "../../../../../lib/global/content/skeleton/aspect_ratio_collector";

export function onFavoritesLoaded(): void {
  FavoritesModel.fetchMissingMetadata();
  collectAspectRatios();
  FavoritesModel.buildSearchIndexAsynchronously();
}

export function onStartedFetchingFavorites(): void {
  FavoritesModel.keepIndexedTagsSorted();
  FavoritesModel.buildSearchIndexSynchronously();
}
