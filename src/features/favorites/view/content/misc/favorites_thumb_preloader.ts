import { FavoriteItem } from "../../../types/favorite/favorite_item";
import { sleep } from "../../../../../utils/misc/async";
import { waitForAllThumbnailsToLoad } from "../../../../../utils/dom/dom";

export async function preload(favorites: FavoriteItem[]): Promise<void> {
    await waitForAllThumbnailsToLoad();

  for (const favorite of favorites) {
    await sleep(3);
    preloadImage(favorite.thumbURL);
  }
}

function preloadImage(url: string): void {
  const img = new Image();

  img.src = url;
}
