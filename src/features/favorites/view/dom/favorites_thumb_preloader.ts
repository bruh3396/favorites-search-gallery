import { Favorite } from "../../../../types/favorite_data_types";
import { GeneralSettings } from "../../../../config/general_settings";
import { sleep } from "../../../../lib/core/async/promise";
import { waitForAllThumbnailsToLoad } from "../../../../lib/dom/thumb2";

export function preloadThumbnails(favorites: Favorite[]): void {
  preloadImages(favorites.map(favorite => favorite.thumbURL));
}

export async function preloadImages(urls: string[]): Promise<void> {
  if (!GeneralSettings.preloadThumbnails) {
    return;
  }
  await waitForAllThumbnailsToLoad();

  for (const url of urls) {
    await sleep(3);
    preloadImage(url);
  }
}

function preloadImage(url: string): void {
  const img = new Image();

  img.src = url;
}
