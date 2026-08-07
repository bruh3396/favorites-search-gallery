import { Favorite } from "@/types/favorite";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";
import { fetchVideoDurationFromFavorite } from "@/lib/remote/rule34/media/duration";

let onDurationPopulated: (favorite: Favorite) => void = () => undefined;

export function setup(onPopulated: (favorite: Favorite) => void): void {
  onDurationPopulated = onPopulated;
}

export function fetchDurations(favorites: FavoriteItem[]): void {
  favorites.forEach(favorite => {
    fetchVideoDurationFromFavorite(favorite)
      .then(duration => {
        favorite.metadata.metrics.duration = duration;
        onDurationPopulated(favorite);
      }).catch(console.error);
  });
}
