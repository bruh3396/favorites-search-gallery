import * as SearchPageModel from "@/features/search_page/model/search_page_model";
import * as SearchPageView from "@/features/search_page/view/search_page_view";
import { FeatureBridge } from "@/app/channels/feature_bridge";
import { Preferences } from "@/app/context/preferences";

export async function toggleIndicator(enabled: boolean): Promise<void> {
  if (enabled) {
    SearchPageView.setFavoriteIndicatorLoading(true);
    await SearchPageModel.ensureFavoriteIdsLoaded(() => FeatureBridge.favoriteIds.call());
    SearchPageView.markAsFavorites(SearchPageModel.filterFavorites(SearchPageModel.allThumbs()));
    SearchPageView.setFavoriteIndicatorLoading(false);
  } else {
    SearchPageView.unmarkAsFavorites(SearchPageModel.allThumbs());
  }
}

export function markExistingFavoritesIfEnabled(thumbs: HTMLElement[]): void {
  if (Preferences.searchPageFavoriteIndicator.value) {
    SearchPageView.markAsFavorites(SearchPageModel.filterFavorites(thumbs));
  }
}

export function onFavoriteAdded(id: string): void {
  SearchPageModel.addFavoriteId(id);

  if (Preferences.searchPageFavoriteIndicator.value) {
    SearchPageView.markAsFavoriteById(id);
  }

  if (FeatureBridge.inGallery.call()) {
    SearchPageView.applyGalleryFavoriteStyle(FeatureBridge.currentGalleryThumb.call());
  }
}
