import { Post } from "@/core/domain/post/post";
import { Favorite } from "@/types/favorite";
import { MediaItem } from "@/types/media";

export class FavoritesDurationEnricher {
  constructor(
    private readonly onFavoriteEnriched: (favorite: Favorite) => void,
    private readonly readDuration: (item: MediaItem) => Promise<number>,
    private readonly persistPost: (post: Post) => void
  ) { }

  public enrich(favorites: Favorite[]): void {
    favorites.forEach(favorite => {
      this.readDuration(favorite)
        .then(duration => {
          favorite.setDuration(duration);
          this.persistPost(favorite.post);
          this.onFavoriteEnriched(favorite);
        }).catch(console.error);
    });
  }
}
