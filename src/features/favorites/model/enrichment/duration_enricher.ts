import { Favorite } from "@/types/favorite";
import { Media } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";

export class FavoritesDurationEnricher {
  constructor(
    private readonly onFavoriteEnriched: (favorite: Favorite) => void,
    private readonly fetchDurationSeconds: (media: Media) => Promise<number>,
    private readonly persistPost: (post: Post) => void
  ) { }

  public enrich(favorites: Favorite[]): void {
    favorites.forEach(favorite => {
      this.fetchDurationSeconds(favorite.media)
        .then(duration => {
          favorite.setDuration(duration);
          this.persistPost(favorite.post);
          this.onFavoriteEnriched(favorite);
        }).catch(console.error);
    });
  }
}
