import { Favorite } from "@/types/favorite";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";
import { fetchVideoDurationFromFavorite } from "@/lib/media/duration";

let onFavoriteEnriched: (favorite: Favorite) => void = () => undefined;

export function setup(onFavoriteEnrichedFn: (favorite: Favorite) => void): void {
  onFavoriteEnriched = onFavoriteEnrichedFn;
}

export function enrich(favorites: FavoriteItem[]): void {
  favorites.forEach(favorite => {
    fetchVideoDurationFromFavorite(favorite)
      .then(duration => {
        favorite.metadata.metrics.duration = duration;
        onFavoriteEnriched(favorite);
      }).catch(console.error);
  });
}
