import * as PostListNavigatorModel from "@/features/post_list_navigator/model/post_list_navigator_model";
import * as PostListNavigatorView from "@/features/post_list_navigator/view/post_list_navigator_view";
import { FeatureBridge, inGallery } from "@/app/channels/feature_bridge";
import { Preferences } from "@/app/context/preferences";

export async function toggleIndicator(enabled: boolean): Promise<void> {
  if (enabled) {
    PostListNavigatorView.setFavoriteIndicatorLoading(true);
    await PostListNavigatorModel.ensureFavoriteIdsLoaded(() => FeatureBridge.favoriteIds.call());
    PostListNavigatorView.markAsFavorites(PostListNavigatorModel.filterFavorites(PostListNavigatorModel.allThumbs()));
    PostListNavigatorView.setFavoriteIndicatorLoading(false);
  } else {
    PostListNavigatorView.unmarkAsFavorites(PostListNavigatorModel.allThumbs());
  }
}

export function markExistingFavoritesIfEnabled(thumbs: HTMLElement[]): void {
  if (Preferences.postList.favoriteIndicator.value) {
    PostListNavigatorView.markAsFavorites(PostListNavigatorModel.filterFavorites(thumbs));
  }
}

export function onFavoriteAdded(id: string): void {
  PostListNavigatorModel.addFavoriteId(id);

  if (Preferences.postList.favoriteIndicator.value) {
    PostListNavigatorView.markAsFavoriteById(id);
  }

  if (inGallery()) {
    PostListNavigatorView.applyGalleryFavoriteStyle(FeatureBridge.currentGalleryThumb.call());
  }
}
