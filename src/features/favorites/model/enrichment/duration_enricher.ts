import * as PostStore from "@/lib/post/store";
import { Favorite } from "@/types/favorite";
import { fetchVideoDurationFromFavorite } from "@/lib/media/duration";

let onFavoriteEnriched: (favorite: Favorite) => void = () => undefined;

export function setup(onFavoriteEnrichedFn: (favorite: Favorite) => void): void {
  onFavoriteEnriched = onFavoriteEnrichedFn;
}

export function enrich(favorites: Favorite[]): void {
  favorites.forEach(favorite => {
    fetchVideoDurationFromFavorite(favorite)
      .then(duration => {
        favorite.setDuration(duration);
        PostStore.write(favorite.post);
        onFavoriteEnriched(favorite);
      }).catch(console.error);
  });
}
