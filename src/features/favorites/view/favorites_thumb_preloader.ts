import {FavoriteItem} from "../types/favorite/favorite_item";
import {FavoritesSettings} from "../../../config/favorites_settings";
import {sleep} from "../../../utils/misc/generic";

export async function preload(favorites: FavoriteItem[]): Promise<void> {
  if (!FavoritesSettings.preloadThumbnails) {
    return;
  }

  for (const favorite of favorites) {
    await sleep(3);
    preloadImage(favorite.thumbURL);
  }
}

function preloadImage(url: string): void {
  const img = new Image();

  img.src = url;
}
