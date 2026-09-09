import * as PostStore from "@/lib/domain/post/store";
import { Favorite } from "@/types/favorite";
import { fetchVideoDurationFromFavorite } from "@/lib/media/duration";

export class FavoritesDurationEnricher {
  constructor(private readonly onFavoriteEnriched: (favorite: Favorite) => void) {}

  public enrich(favorites: Favorite[]): void {
    favorites.forEach(favorite => {
      fetchVideoDurationFromFavorite(favorite)
        .then(duration => {
          favorite.setDuration(duration);
          PostStore.write(favorite.post);
          this.onFavoriteEnriched(favorite);
        }).catch(console.error);
    });
  }
}
