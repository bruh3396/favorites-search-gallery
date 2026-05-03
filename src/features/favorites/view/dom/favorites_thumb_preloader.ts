import { Favorite } from "../../../../types/favorite";
import { GeneralSettings } from "../../../../config/general_settings";
import { preloadImage } from "../../../../utils/dom/image";
import { sleep } from "../../../../lib/core/scheduling/promise";
import { throttle } from "../../../../lib/core/scheduling/rate_limiting";
import { waitForAllThumbnailsToLoad } from "../../../../lib/dom/content_thumb";

export function preloadThumbnails(favorites: Favorite[]): void {
  preloadImages(favorites.map(favorite => favorite.thumbUrl));
}

export const preloadImages = throttle(async(urls: string[]) => {
  if (!GeneralSettings.preloadThumbnails) {
    return;
  }
  await waitForAllThumbnailsToLoad();

  for (const url of urls) {
    await sleep(3);
    preloadImage(url);
  }
}, 2000);
