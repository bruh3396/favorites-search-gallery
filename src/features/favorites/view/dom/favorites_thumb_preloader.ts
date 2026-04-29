import { Favorite } from "../../../../types/favorite";
import { GeneralSettings } from "../../../../config/general_settings";
import { sleep } from "../../../../lib/core/scheduling/promise";
import { waitForAllThumbnailsToLoad } from "../../../../lib/dom/content_thumb";

export function preloadThumbnails(favorites: Favorite[]): void {
  preloadImages(favorites.map(favorite => favorite.thumbUrl));
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
