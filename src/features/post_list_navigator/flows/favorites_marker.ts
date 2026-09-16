import { PostListNavigatorFlow } from "@/features/post_list_navigator/flows/flow";

export class PostListNavigatorFavoritesMarkerFlow extends PostListNavigatorFlow {

  public async toggleIndicator(enabled: boolean): Promise<void> {
    if (enabled) {
      this.view.setFavoriteIndicatorLoading(true);
      await this.model.ensureFavoriteIdsLoaded(() => this.context.featureBridge.favorites.favoriteIds.call());
      this.view.markAsFavorites(this.model.filterFavorites(this.model.allThumbs()));
      this.view.setFavoriteIndicatorLoading(false);
    } else {
      this.view.unmarkAsFavorites(this.model.allThumbs());
    }
  }

  public markExistingFavoritesIfEnabled(thumbs: HTMLElement[]): void {
    if (this.context.preferences.postList.favoriteIndicator.value) {
      this.view.markAsFavorites(this.model.filterFavorites(thumbs));
    }
  }

  public registerFavorite(id: string): void {
    this.model.addFavoriteId(id);

    if (this.context.preferences.postList.favoriteIndicator.value) {
      this.view.markAsFavoriteById(id);
    }
  }
}
