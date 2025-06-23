import { Favorite } from "../../types/interfaces/interfaces";
import { sleep } from "../misc/async";
import { waitForAllThumbnailsToLoad } from "./dom";

export function preloadThumbnails(favorites: Favorite[]): void {
  preloadImages(favorites.map(favorite => favorite.thumbURL));
}

export async function preloadImages(urls: string[]): Promise<void> {
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
